import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma' // Raw Prisma client for transaction options
import { logAdminAction } from '@/lib/audit-logger'
import { randomUUID } from 'crypto' // Built-in Node.js crypto for UUID generation

export interface DeleteUserOptions {
  userId: string
  adminId: string
  permanent: boolean
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export interface DeleteUserResult {
  action: 'anonymized' | 'deleted' | 'deactivated'
  message: string
  preservedData?: {
    clientBookings: number
    providerBookings: number
    reviews: number
    payouts: number
  }
  user?: {
    id: string
    email: string
    isActive: boolean
    deletedAt: Date | null
  }
}

interface TransactionalCounts {
  clientBookings: number
  providerBookings: number
  providerReviews: number
  providerPayouts: number
}

/**
 * Generate a non-reversible, non-identifying anonymized email
 * Uses random UUID to prevent identifier leakage and ensure GDPR compliance
 */
function generateAnonymizedEmail(): string {
  const randomId = randomUUID()
  return `deleted+${randomId}@example.invalid`
}

/**
 * Calculate all transactional data counts within a transaction
 * This prevents race conditions where data is created mid-operation
 */
async function calculateTransactionalCounts(
  tx: Prisma.TransactionClient,
  userId: string,
  providerId: string | null
): Promise<TransactionalCounts> {
  const [clientBookings, providerBookings, providerReviews, providerPayouts] = await Promise.all([
    tx.booking.count({ where: { clientId: userId } }),
    providerId ? tx.booking.count({ where: { providerId } }) : Promise.resolve(0),
    providerId ? tx.review.count({ where: { providerId } }) : Promise.resolve(0),
    providerId ? tx.payout.count({ where: { providerId } }) : Promise.resolve(0),
  ])

  return {
    clientBookings,
    providerBookings,
    providerReviews,
    providerPayouts,
  }
}

/**
 * Anonymize user data while preserving transactional records
 * This is the canonical production behavior when transactional data exists
 */
async function anonymizeUser(
  tx: Prisma.TransactionClient,
  userId: string,
  providerId: string | null
): Promise<{ user: any; provider: any | null }> {
  const now = new Date()
  const anonymizedEmail = generateAnonymizedEmail()

  // Anonymize user
  const anonymizedUser = await tx.user.update({
    where: { id: userId },
    data: {
      email: anonymizedEmail,
      name: 'Deleted User',
      phone: null,
      avatar: null,
      password: null,
      googleId: null,
      appleId: null,
      isActive: false,
      deletedAt: now, // Tombstone flag
    },
  })

  // Anonymize provider profile if exists
  // Only ignore expected "not found" errors - fail fast on unexpected errors
  let anonymizedProvider = null
  if (providerId) {
    try {
      anonymizedProvider = await tx.provider.update({
        where: { id: providerId },
        data: {
          businessName: null,
          description: null,
          location: null,
          idDocument: null,
          proofOfAddress: null,
          profileImages: [],
          certifications: [],
          status: 'SUSPENDED',
          available: false,
          // Preserve: bookings, reviews, payouts, catalogueItems, services
        },
      })
    } catch (error: any) {
      // Only allow idempotent "not found" cases - fail on unexpected errors
      if (error.code === 'P2025') {
        // Record not found - provider may have been deleted already (idempotent case)
        console.warn(`⚠️ Provider ${providerId} not found during anonymization (idempotent - already deleted)`)
      } else {
        // Unexpected error - re-throw to fail transaction atomically
        // Silent partial anonymization is unacceptable
        console.error(`❌ Unexpected error during provider anonymization:`, error)
        throw error
      }
    }
  }

  return { user: anonymizedUser, provider: anonymizedProvider }
}

/**
 * Hard delete user - only safe when zero transactional data exists
 * This path is rarely used and requires strict validation
 */
async function hardDeleteUser(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<any> {
  return await tx.user.delete({
    where: { id: userId },
  })
}

/**
 * Soft delete user - deactivate account
 */
async function softDeleteUser(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<any> {
  return await tx.user.update({
    where: { id: userId },
    data: {
      isActive: false,
    },
  })
}

/**
 * Core deletion policy logic - enforces rules at database decision point
 * ALL reads, counts, and writes happen inside a single transaction
 */
async function deleteUserWithPolicy(
  tx: Prisma.TransactionClient,
  options: DeleteUserOptions
): Promise<DeleteUserResult> {
  const { userId, adminId, permanent } = options

  // Prevent admin self-deletion (defensive check inside transaction)
  if (userId === adminId) {
    throw new Error('Cannot delete your own account')
  }

  // Fetch user with provider info (inside transaction)
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      provider: {
        select: { id: true },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // ✅ FIX 1: Idempotent handling - if already anonymized, return success
  // Do NOT throw - this makes the operation repeat-safe
  if (user.deletedAt) {
    // User is already anonymized - return successful no-op response
    // This preserves idempotency for retries, admin re-submissions, background jobs
    console.log(`ℹ️ User ${userId} is already anonymized (idempotent operation)`)

    // Fetch transactional counts for response (may be stale but provides context)
    const providerId = user.provider?.id || null
    const counts = await calculateTransactionalCounts(tx, userId, providerId)

    return {
      action: 'anonymized',
      message: 'User already anonymized',
      preservedData: {
        clientBookings: counts.clientBookings,
        providerBookings: counts.providerBookings,
        reviews: counts.providerReviews,
        payouts: counts.providerPayouts,
      },
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        deletedAt: user.deletedAt,
      },
    }
  }

  const providerId = user.provider?.id || null

  // Calculate transactional counts INSIDE transaction (prevents race conditions)
  const counts = await calculateTransactionalCounts(tx, userId, providerId)
  const totalTransactionalData =
    counts.clientBookings +
    counts.providerBookings +
    counts.providerReviews +
    counts.providerPayouts

  // Handle permanent deletion request
  if (permanent) {
    // STRICT RULE: If ANY transactional data exists, FORCE anonymization
    // Hard delete is impossible, even if permanent === true
    if (totalTransactionalData > 0) {
      console.log(`🛡️ Enforcing anonymization for user ${user.email} - transactional data exists`)
      console.log(`   Counts: ${JSON.stringify(counts)}`)

      const { user: anonymizedUser } = await anonymizeUser(tx, userId, providerId)

      return {
        action: 'anonymized',
        message: 'User anonymized successfully',
        preservedData: {
          clientBookings: counts.clientBookings,
          providerBookings: counts.providerBookings,
          reviews: counts.providerReviews,
          payouts: counts.providerPayouts,
        },
        user: {
          id: anonymizedUser.id,
          email: anonymizedUser.email,
          isActive: anonymizedUser.isActive,
          deletedAt: anonymizedUser.deletedAt,
        },
      }
    }

    // Only reach here if ZERO transactional data - safe to hard delete
    console.log(`🗑️ Performing hard delete for user ${user.email} (no transactional data)`)
    await hardDeleteUser(tx, userId)

    return {
      action: 'deleted',
      message: 'User permanently deleted successfully',
      note: 'No transactional data existed, so hard delete was performed.',
    }
  }

  // Soft delete - always allowed
  console.log(`🔒 Performing soft delete for user ${user.email}`)
  const deactivatedUser = await softDeleteUser(tx, userId)

  return {
    action: 'deactivated',
    message: 'User deactivated successfully',
    user: {
      id: deactivatedUser.id,
      email: deactivatedUser.email,
      isActive: deactivatedUser.isActive,
      deletedAt: deactivatedUser.deletedAt,
    },
  }
}

/**
 * Main service function - orchestrates deletion with full transaction safety
 */
export async function deleteUser(options: DeleteUserOptions): Promise<DeleteUserResult> {
  const { userId, adminId, reason, ipAddress, userAgent } = options

  // ✅ FIX 4: Guard against missing _prisma_migrations table
  // Fail fast with actionable diagnostics if migrations table doesn't exist
  try {
    // Attempt to query migrations table to verify it exists
    await prisma.$queryRaw`SELECT 1 FROM _prisma_migrations LIMIT 1`
  } catch (migrationError: any) {
    if (
      migrationError.message?.includes('_prisma_migrations') ||
      migrationError.message?.includes('does not exist') ||
      migrationError.code === '42P01' // PostgreSQL: relation does not exist
    ) {
      const error = `
${'='.repeat(80)}
🚨 CRITICAL: Prisma migrations table missing
${'='.repeat(80)}
The _prisma_migrations table does not exist in the database.

This indicates the database schema is not properly initialized.

REQUIRED ACTION:
1. Run: npx prisma migrate deploy
2. Or for development: npx prisma migrate dev

DO NOT continue without running migrations.
${'='.repeat(80)}
`
      console.error(error)
      throw new Error('Database migrations not applied. Run: npx prisma migrate deploy')
    }
    // If it's a different error (e.g., connection issue), let it propagate
    throw migrationError
  }

  // Use raw Prisma client for transaction with strict isolation
  // SERIALIZABLE isolation prevents race conditions
  const result = await prisma.$transaction(
    async (tx) => {
      return await deleteUserWithPolicy(tx, options)
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Strictest isolation
      timeout: 30000, // 30 second timeout
      maxWait: 10000, // 10 second max wait for transaction slot
    }
  )

  // Log admin action AFTER transaction commits (non-blocking)
  try {
    await logAdminAction({
      adminId,
      action:
        result.action === 'anonymized'
          ? ('USER_ANONYMIZED' as any)
          : result.action === 'deleted'
          ? ('USER_DELETED' as any)
          : ('USER_SUSPENDED' as any),
      targetType: 'USER',
      targetId: userId,
      details: {
        reason,
        action: result.action,
        preservedData: result.preservedData,
        message: result.message,
      },
      ipAddress,
      userAgent,
    })
  } catch (auditError) {
    // Audit logging failures must never affect the operation
    console.error('⚠️ Failed to log admin action (non-critical):', auditError)
  }

  return result
}

/**
 * Get user details for deletion preview (non-transactional, read-only)
 * 
 * ⚠️ ADVISORY ONLY: This preview is best-effort and may become stale under concurrency.
 * 
 * Final enforcement happens inside the SERIALIZABLE transaction in deleteUser().
 * 
 * Use this for UI previews and admin decision-making, but do not rely on it
 * for final deletion decisions - the transaction will recalculate all counts
 * atomically and enforce policy at the database decision point.
 * 
 * @param userId - User ID to preview
 * @returns Preview data or null if user not found
 */
export async function getUserDeletionPreview(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      provider: {
        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
              payouts: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    transactionalData: {
      clientBookings: user._count.bookings,
      providerBookings: user.provider?._count?.bookings || 0,
      reviews: user.provider?._count?.reviews || 0,
      payouts: user.provider?._count?.payouts || 0,
    },
    // Explicit disclaimer
    _previewOnly: true,
    _note: 'This is an advisory preview. Final enforcement happens in the transaction.',
  }
}
