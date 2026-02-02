import { prisma } from '@/lib/prisma';
import { AccountType, EntryType, ReferenceType } from '@prisma/client';

/**
 * LedgerService - Append-only, immutable ledger system
 * 
 * Core principle: No running balances stored. Balance computed on demand.
 * Balance = SUM(CREDIT) - SUM(DEBIT)
 * 
 * This ensures:
 * - Auditability (every entry is immutable)
 * - Recomputability (balance always correct)
 * - No drift (no fragile running balance logic)
 */
export class LedgerService {
  /**
   * Create ledger entry (append-only, immutable)
   */
  static async createEntry(params: {
    accountType: AccountType;
    accountId: string;
    entryType: EntryType;
    amount: number;
    referenceType: ReferenceType;
    referenceId: string;
    description: string;
    metadata?: any;
  }) {
    // Validate amount is positive
    if (params.amount <= 0) {
      throw new Error('Ledger entry amount must be positive');
    }

    // Round amount to 2 decimal places
    const roundedAmount = Math.round(params.amount * 100) / 100;

    return await prisma.ledgerEntry.create({
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
   * Get account balance (computed on demand)
   * Balance = SUM(CREDIT) - SUM(DEBIT)
   * 
   * Can return negative values (debt) - this is intentional for refunds
   */
  static async getBalance(
    accountType: AccountType,
    accountId: string
  ): Promise<number> {
    const result = await prisma.ledgerEntry.groupBy({
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
    
    // Round to 2 decimal places
    return Math.round(balance * 100) / 100;
  }

  /**
   * Get ledger history
   */
  static async getHistory(params: {
    accountType?: AccountType;
    accountId?: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    limit?: number;
  }) {
    return await prisma.ledgerEntry.findMany({
      where: {
        ...(params.accountType && { accountType: params.accountType }),
        ...(params.accountId && { accountId: params.accountId }),
        ...(params.referenceType && { referenceType: params.referenceType }),
        ...(params.referenceId && { referenceId: params.referenceId }),
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
    });
  }

  /**
   * Verify liquidity before payout
   * Returns true if bank account has sufficient balance
   * 
   * This prevents paying out before funds are settled
   */
  static async verifyLiquidity(payoutAmount: number): Promise<{
    sufficient: boolean;
    bankBalance: number;
    required: number;
  }> {
    const bankBalance = await this.getBalance('BANK_ACCOUNT', 'BANK_MAIN');
    
    return {
      sufficient: bankBalance >= payoutAmount,
      bankBalance,
      required: payoutAmount,
    };
  }

  /**
   * Get provider balance
   * Helper method for common use case
   */
  static async getProviderBalance(providerId: string): Promise<number> {
    return await this.getBalance('PROVIDER_BALANCE', providerId);
  }

  /**
   * Get platform revenue
   * Helper method for common use case
   */
  static async getPlatformRevenue(): Promise<number> {
    return await this.getBalance('PLATFORM_REVENUE', 'PLATFORM');
  }

  /**
   * Get bank account balance
   * Helper method for common use case
   */
  static async getBankBalance(): Promise<number> {
    return await this.getBalance('BANK_ACCOUNT', 'BANK_MAIN');
  }
}
