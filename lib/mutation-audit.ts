/**
 * MUTATION AUDIT LOGGING SERVICE
 * 
 * Provides append-only audit trail for production mutations.
 * Tracks capability usage, executor identity, and mutation outcomes.
 * 
 * CRITICAL:
 * - Audit logging failures are non-blocking (mutations proceed)
 * - Production failures logged with high-signal structured format
 * - Runtime mutation attempts are violations (not audit events)
 */

import { PrismaClient } from '@prisma/client';

// Capability versions (optional, for tracking contract evolution)
const CAPABILITY_VERSIONS: Record<string, string> = {
  'DEPLOY_DB': '1.0',
  'SYNC_REFERENCE_DATA': '1.0',
} as const;

/**
 * Executor identity detection
 * Returns stable ID + human-readable reference
 */
export function detectExecutor(): {
  type: 'CI' | 'SCRIPT';
  id: string;
  reference: string | null;
} {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const isScript = typeof require !== 'undefined' && require.main === module;

  // Runtime detection (should never reach here due to guard, but defensive)
  if (!isCI && !isScript) {
    throw new Error('Invalid executor type: RUNTIME mutations are forbidden');
  }

  if (isCI) {
    // CI environment - stable ID from job identifier
    const jobId =
      process.env.GITHUB_RUN_ID ||           // GitHub Actions
      process.env.CI_JOB_ID ||              // GitLab CI
      process.env.BUILDKITE_BUILD_ID ||     // Buildkite
      process.env.CIRCLE_BUILD_NUM ||       // CircleCI
      process.env.TRAVIS_BUILD_ID ||        // Travis CI
      `CI_${Date.now()}`;                   // Fallback: timestamp-based

    // Human-readable reference (CI job URL if available)
    const jobUrl =
      (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID)
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : (process.env.CI_PIPELINE_URL || null);

    return {
      type: 'CI',
      id: jobId,
      reference: jobUrl,
    };
  }

  // Script execution
  const scriptPath = require.main?.filename || 'unknown';

  // Stable ID: hash of script path (consistent across runs)
  const crypto = require('crypto');
  const pathHash = crypto.createHash('sha256')
    .update(scriptPath)
    .digest('hex')
    .substring(0, 16);  // 16-char hash

  return {
    type: 'SCRIPT',
    id: pathHash,
    reference: scriptPath,
  };
}

/**
 * Get environment fingerprint from database
 * Reads from database_metadata.fingerprint
 */
export async function getEnvironmentFingerprint(
  databaseUrl: string
): Promise<string | null> {
  try {
    // Lazy import PrismaClient
    const { PrismaClient } = require('@prisma/client');
    const tempPrisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: ['error'],
    });

    try {
      const metadata = await tempPrisma.$queryRaw<Array<{
        fingerprint: string;
      }>>`
        SELECT fingerprint 
        FROM database_metadata 
        WHERE id = 'singleton'
        LIMIT 1
      `;

      await tempPrisma.$disconnect();

      if (metadata && metadata.length > 0) {
        return metadata[0].fingerprint;
      }

      return null;
    } catch (error) {
      await tempPrisma.$disconnect().catch(() => {});
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Determine environment from NODE_ENV and database URL
 */
function detectEnvironment(): 'prod' | 'staging' | 'dev' {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    return 'prod';
  }
  
  if (nodeEnv === 'staging') {
    return 'staging';
  }
  
  return 'dev';
}

/**
 * High-signal logging for audit failures in production
 */
function logAuditFailure(
  operation: 'create' | 'update',
  mutationContext: {
    capability: string;
    status: string;
    executorType: string;
    executorId: string;
    environmentFingerprint: string | null;
    startedAt: string;
    auditLogId?: string | null;
  },
  error: Error
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const logData = {
    type: 'AUDIT_LOG_FAILURE',
    severity: isProduction ? 'CRITICAL' : 'WARNING',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : detectEnvironment(),
    mutation_context: mutationContext,
    audit_error: {
      message: error.message,
      stack: error.stack,
      operation: operation,
    },
    mutation_proceeded: true,
    recovery_action: 'Manual audit log entry required - query console logs for mutation_context',
  };

  if (isProduction) {
    console.error(JSON.stringify(logData));
  } else {
    console.warn(JSON.stringify(logData));
  }
}

/**
 * Create mutation audit log entry
 * Returns audit log ID for later status updates
 */
export async function createMutationAuditLog(
  capability: 'DEPLOY_DB' | 'SYNC_REFERENCE_DATA',
  databaseUrl: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  const executor = detectExecutor();
  const environment = detectEnvironment();
  const fingerprint = await getEnvironmentFingerprint(databaseUrl);
  const capabilityVersion = CAPABILITY_VERSIONS[capability] || null;

  const mutationContext = {
    capability,
    status: 'pending',
    executorType: executor.type,
    executorId: executor.id,
    environmentFingerprint: fingerprint,
    startedAt: new Date().toISOString(),
  };

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: ['error'],
    });

    const auditLog = await prisma.mutationAuditLog.create({
      data: {
        capability,
        capabilityVersion,
        status: 'pending',
        environment,
        environmentFingerprint: fingerprint || 'UNKNOWN',
        executorType: executor.type,
        executorId: executor.id,
        executorReference: executor.reference,
        startedAt: new Date(),
        metadata: metadata || null,
      },
    });

    await prisma.$disconnect();
    return auditLog.id;
  } catch (error) {
    // Non-blocking: log failure but don't throw
    logAuditFailure('create', mutationContext, error as Error);
    return null;
  }
}

/**
 * Update mutation audit log status
 * Transitions: pending -> success | failed
 */
export async function updateMutationAuditLogStatus(
  auditLogId: string | null,
  databaseUrl: string,
  status: 'success' | 'failed',
  errorMessage?: string | null,
  resultMetadata?: Record<string, any>
): Promise<void> {
  if (!auditLogId) {
    // No audit log ID means creation failed - log this update attempt
    const executor = detectExecutor();
    logAuditFailure(
      'update',
      {
        capability: 'UNKNOWN',
        status,
        executorType: executor.type,
        executorId: executor.id,
        environmentFingerprint: null,
        startedAt: new Date().toISOString(),
        auditLogId: null,
      },
      new Error('Cannot update: audit log creation failed')
    );
    return;
  }

  const mutationContext = {
    capability: 'UNKNOWN',
    status,
    executorType: 'UNKNOWN',
    executorId: 'UNKNOWN',
    environmentFingerprint: null,
    startedAt: new Date().toISOString(),
    auditLogId,
  };

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: ['error'],
    });

    // Merge existing metadata with result metadata
    const existing = await prisma.mutationAuditLog.findUnique({
      where: { id: auditLogId },
      select: { metadata: true },
    });

    const mergedMetadata = existing?.metadata
      ? { ...(existing.metadata as Record<string, any>), ...(resultMetadata || {}) }
      : resultMetadata || null;

    await prisma.mutationAuditLog.update({
      where: { id: auditLogId },
      data: {
        status,
        completedAt: new Date(),
        errorMessage: errorMessage || null,
        metadata: mergedMetadata,
      },
    });

    await prisma.$disconnect();
  } catch (error) {
    // Non-blocking: log failure but don't throw
    logAuditFailure('update', mutationContext, error as Error);
  }
}
