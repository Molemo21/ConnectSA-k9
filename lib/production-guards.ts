/**
 * Production mutation capabilities
 *
 * Runtime code validates INTENT, not file paths.
 * Operational tooling maps capabilities to scripts.
 *
 * CRITICAL:
 * - Runtime code must NEVER reference filesystem scripts
 * - Capabilities express intent, not implementation
 */

const ALLOWED_MUTATION_CAPABILITIES = [
  'DEPLOY_DB',           // Database schema migrations
  'SYNC_REFERENCE_DATA', // Reference data promotion
] as const;

type MutationCapability =
  typeof ALLOWED_MUTATION_CAPABILITIES[number];

/**
 * Validate that a mutation capability is allowed.
 *
 * This function enforces:
 * 1. Intent-based validation (capabilities, not paths)
 * 2. Hard runtime isolation (production runtime can never mutate)
 */
export function validateMutationCapability(
  capability: string
): void {
  // Operational scripts: CI=true, NODE_ENV=production, running as script
  // Production runtime: NODE_ENV=production, NOT in CI, NOT a script
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const isScript = typeof require !== 'undefined' && require.main === module;
  
  const isProductionRuntime =
    process.env.NODE_ENV === 'production' &&
    !isCI &&
    !isScript;

  if (isProductionRuntime) {
    // Log runtime violation as security event (not audit event)
    console.error(JSON.stringify({
      type: 'MUTATION_VIOLATION',
      severity: 'CRITICAL',
      timestamp: new Date().toISOString(),
      capability: capability,
      reason: 'Production runtime mutation attempt',
      executor_type: 'RUNTIME',
      node_env: process.env.NODE_ENV,
      ci: process.env.CI,
      stack_trace: new Error().stack,
    }));
    
    throw new Error(
      'Operational mutation capabilities are forbidden in production runtime.'
    );
  }

  const isAllowed = ALLOWED_MUTATION_CAPABILITIES.includes(
    capability as MutationCapability
  );

  if (!isAllowed) {
    throw new Error(
      [
        '='.repeat(80),
        '🚨 BLOCKED: Mutation capability not in allowlist',
        '='.repeat(80),
        `Capability: ${capability}`,
        'Allowed capabilities:',
        ...ALLOWED_MUTATION_CAPABILITIES.map(c => `  - ${c}`),
        '='.repeat(80),
      ].join('\n')
    );
  }
}
