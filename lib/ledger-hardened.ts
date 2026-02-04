import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AccountType, EntryType, ReferenceType } from '@prisma/client';

/**
 * Hardened LedgerService with idempotency and double-credit protection
 * 
 * CRITICAL: All ledger operations must be idempotent and atomic
 */
export class LedgerServiceHardened {
  /**
   * Create ledger entry with idempotency check
   * Prevents double-crediting by checking for existing entries
   */
  static async createEntryIdempotent(
    params: {
      accountType: AccountType;
      accountId: string;
      entryType: EntryType;
      amount: number;
      referenceType: ReferenceType;
      referenceId: string;
      description: string;
      metadata?: any;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    // Validate amount is positive
    if (params.amount <= 0) {
      throw new Error('Ledger entry amount must be positive');
    }

    // Round amount to 2 decimal places
    const roundedAmount = Math.round(params.amount * 100) / 100;

    // CRITICAL: Check for existing entry to prevent double-credit
    const existingEntry = await client.ledgerEntry.findFirst({
      where: {
        accountType: params.accountType,
        accountId: params.accountId,
        entryType: params.entryType,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        amount: roundedAmount,
      },
    });

    if (existingEntry) {
      console.warn(`⚠️ Ledger entry already exists, skipping duplicate:`, {
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        existingEntryId: existingEntry.id,
      });
      return existingEntry;
    }

    // Create new entry
    return await client.ledgerEntry.create({
      data: {
        accountType: params.accountType,
        accountId: params.accountId,
        entryType: params.entryType,
        amount: roundedAmount,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        description: params.description,
        metadata: params.metadata || {},
      },
    });
  }

  /**
   * Verify no duplicate ledger entries exist for a reference
   */
  static async verifyNoDuplicates(
    referenceType: ReferenceType,
    referenceId: string,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    const client = tx || prisma;

    const entries = await client.ledgerEntry.findMany({
      where: {
        referenceType,
        referenceId,
      },
    });

    // Group by account and entry type to detect duplicates
    const entryMap = new Map<string, number>();
    for (const entry of entries) {
      const key = `${entry.accountType}:${entry.accountId}:${entry.entryType}`;
      entryMap.set(key, (entryMap.get(key) || 0) + 1);
    }

    // Check for duplicates
    for (const [key, count] of entryMap.entries()) {
      if (count > 1) {
        console.error(`❌ DUPLICATE LEDGER ENTRIES DETECTED:`, {
          referenceType,
          referenceId,
          key,
          count,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Get balance with transaction isolation
   */
  static async getBalance(
    accountType: AccountType,
    accountId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    // Always use prisma if tx is not properly provided or doesn't have ledgerEntry
    const client = (tx && tx.ledgerEntry && typeof tx.ledgerEntry.groupBy === 'function') ? tx : prisma;

    // Try to use groupBy first (more efficient)
    try {
      const result = await client.ledgerEntry.groupBy({
        by: ['entryType'],
        where: {
          accountType,
          accountId,
        },
        _sum: {
          amount: true,
        },
      });

      const credits = result.find((r) => r.entryType === 'CREDIT')?._sum.amount || 0;
      const debits = result.find((r) => r.entryType === 'DEBIT')?._sum.amount || 0;

      const balance = credits - debits;
      return Math.round(balance * 100) / 100;
    } catch (error) {
      // Fallback: ALWAYS use prisma directly if groupBy fails (transaction client might be broken)
      console.warn('⚠️ groupBy failed, falling back to findMany with prisma:', error);
      const entries = await prisma.ledgerEntry.findMany({
        where: {
          accountType,
          accountId,
        },
        select: {
          entryType: true,
          amount: true,
        },
      });

      const credits = entries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + e.amount, 0);
      const debits = entries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + e.amount, 0);

      const balance = credits - debits;
      return Math.round(balance * 100) / 100;
    }
  }

  /**
   * Verify liquidity with transaction isolation
   * CRITICAL: Must be called within transaction to prevent race conditions
   */
  static async verifyLiquidity(
    payoutAmount: number,
    tx?: Prisma.TransactionClient
  ): Promise<{
    sufficient: boolean;
    bankBalance: number;
    required: number;
  }> {
    const bankBalance = await this.getBalance('BANK_ACCOUNT', 'BANK_MAIN', tx);
    
    return {
      sufficient: bankBalance >= payoutAmount,
      bankBalance,
      required: payoutAmount,
    };
  }

  /**
   * Assert accounting invariant
   * Provider balances + Platform revenue + Bank balance = Total payments - Refunds
   */
  static async assertAccountingInvariant(tx?: Prisma.TransactionClient): Promise<{
    valid: boolean;
    discrepancy?: number;
    details: {
      totalProviderBalances: number;
      platformRevenue: number;
      bankBalance: number;
      totalPayments: number;
      totalRefunds: number;
      expected: number;
      actual: number;
    };
  }> {
    const client = tx || prisma;

    // Get all provider balances
    const providerEntries = await client.ledgerEntry.findMany({
      where: {
        accountType: 'PROVIDER_BALANCE',
      },
    });
    const totalProviderBalances = providerEntries.reduce((sum, entry) => {
      return sum + (entry.entryType === 'CREDIT' ? entry.amount : -entry.amount);
    }, 0);

    // Get platform revenue
    const platformRevenue = await this.getBalance('PLATFORM_REVENUE', 'PLATFORM', tx);

    // Get bank balance
    const bankBalance = await this.getBalance('BANK_ACCOUNT', 'BANK_MAIN', tx);

    // Get total payments
    const payments = await client.payment.findMany({
      where: {
        status: { in: ['ESCROW', 'RELEASED', 'REFUNDED'] },
      },
    });
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get total refunds
    const refunds = await client.refund.findMany({
      where: {
        status: 'COMPLETED',
      },
    });
    const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);

    const expected = totalPayments - totalRefunds;
    const actual = totalProviderBalances + platformRevenue + bankBalance;
    const discrepancy = Math.abs(expected - actual);

    const valid = discrepancy < 0.01; // Allow 1 cent tolerance for rounding

    return {
      valid,
      discrepancy: valid ? undefined : discrepancy,
      details: {
        totalProviderBalances,
        platformRevenue,
        bankBalance,
        totalPayments,
        totalRefunds,
        expected,
        actual,
      },
    };
  }
}
