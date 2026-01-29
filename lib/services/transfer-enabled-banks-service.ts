import { paystackClient } from '@/lib/paystack';

interface TransferEnabledBank {
  code: string;
  name: string;
  slug?: string;
  type?: string;
  country: string;
  currency: string;
  pay_with_bank_transfer?: boolean; // Advisory metadata from Paystack
  verified: boolean; // Verified via Paystack API metadata (advisory)
  fetchedAt: Date;
}

interface BankCache {
  banks: TransferEnabledBank[];
  fetchedAt: Date;
  expiresAt: Date;
  country: string;
}

/**
 * Transfer-Enabled Banks Service
 * 
 * PRODUCTION-SAFE: Uses Paystack's transfer-enabled metadata (advisory)
 * - Uses pay_with_bank_transfer=true parameter (Paystack API metadata)
 * - NO fake recipient creation
 * - NO probing or testing
 * - Zero financial operations for validation
 * - Paystack metadata is advisory, not authoritative
 * 
 * NOTE: This service is provider-agnostic and can be swapped
 */
class TransferEnabledBanksService {
  private cache: Map<string, BankCache> = new Map();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private isRefreshing = false;

  /**
   * Get transfer-enabled banks for a country
   * Uses Paystack's pay_with_bank_transfer=true parameter (advisory metadata)
   */
  async getTransferEnabledBanks(country: string = 'ZA'): Promise<TransferEnabledBank[]> {
    const cacheKey = country;
    const cached = this.cache.get(cacheKey);

    // Return cached if still valid
    if (cached && cached.expiresAt > new Date()) {
      console.log(`✅ Using cached transfer-enabled banks (${cached.banks.length} banks)`);
      return cached.banks;
    }

    // Refresh if expired or missing
    if (!this.isRefreshing) {
      return await this.refreshTransferEnabledBanks(country);
    }

    // If refresh in progress, return stale cache or empty
    return cached?.banks || [];
  }

  /**
   * Refresh transfer-enabled banks from Paystack
   * Uses pay_with_bank_transfer=true parameter (advisory metadata)
   * NO fake operations, NO probing, NO test recipients
   */
  async refreshTransferEnabledBanks(country: string = 'ZA'): Promise<TransferEnabledBank[]> {
    if (this.isRefreshing) {
      console.log('⏳ Transfer-enabled banks refresh already in progress');
      const cached = this.cache.get(country);
      return cached?.banks || [];
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      console.log(`🔄 Fetching transfer-enabled banks from Paystack for ${country}...`);

      // Use Paystack's transfer-enabled filter (advisory metadata)
      // This provides guidance on which banks may support transfers
      const banksResponse = await paystackClient.listBanks({ 
        country,
        pay_with_bank_transfer: true 
      });
      
      if (!banksResponse.status || !banksResponse.data) {
        throw new Error(`Paystack listBanks failed: ${banksResponse.message}`);
      }

      // Filter only active, non-deleted banks
      const transferEnabledBanks: TransferEnabledBank[] = banksResponse.data
        .filter(bank => bank.active && !bank.is_deleted)
        .map(bank => ({
          code: bank.code,
          name: bank.name,
          slug: bank.slug,
          type: bank.type,
          country: bank.country || country,
          currency: bank.currency || 'ZAR',
          pay_with_bank_transfer: bank.pay_with_bank_transfer ?? true, // Advisory metadata
          verified: true, // Verified via Paystack API metadata (advisory)
          fetchedAt: new Date(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Cache results
      const now = new Date();
      const cache: BankCache = {
        banks: transferEnabledBanks,
        fetchedAt: now,
        expiresAt: new Date(now.getTime() + this.CACHE_TTL_MS),
        country,
      };

      this.cache.set(country, cache);

      const duration = Date.now() - startTime;
      console.log(`✅ Transfer-enabled banks fetched: ${transferEnabledBanks.length} banks (${duration}ms)`);
      console.log(`📊 Source: Paystack API with pay_with_bank_transfer=true (advisory metadata)`);

      return transferEnabledBanks;

    } catch (error) {
      console.error('❌ Failed to fetch transfer-enabled banks:', error);
      
      // Return stale cache if available
      const cached = this.cache.get(country);
      if (cached) {
        console.warn('⚠️ Using stale cache due to refresh failure');
        return cached.banks;
      }

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check if a bank code is transfer-enabled (advisory check)
   */
  async isTransferEnabled(bankCode: string, country: string = 'ZA'): Promise<boolean> {
    const banks = await this.getTransferEnabledBanks(country);
    return banks.some(bank => bank.code === bankCode);
  }

  /**
   * Get transfer-enabled bank by code
   */
  async getTransferEnabledBank(bankCode: string, country: string = 'ZA'): Promise<TransferEnabledBank | undefined> {
    const banks = await this.getTransferEnabledBanks(country);
    return banks.find(bank => bank.code === bankCode);
  }

  /**
   * Force refresh cache (for admin/manual refresh)
   */
  async forceRefresh(country: string = 'ZA'): Promise<TransferEnabledBank[]> {
    this.cache.delete(country);
    return await this.refreshTransferEnabledBanks(country);
  }

  /**
   * Get cache status (for monitoring)
   */
  getCacheStatus(country: string = 'ZA'): {
    cached: boolean;
    expiresAt?: Date;
    bankCount?: number;
    isStale: boolean;
  } {
    const cached = this.cache.get(country);
    if (!cached) {
      return { cached: false, isStale: true };
    }

    return {
      cached: true,
      expiresAt: cached.expiresAt,
      bankCount: cached.banks.length,
      isStale: cached.expiresAt <= new Date(),
    };
  }
}

// Singleton instance
export const transferEnabledBanksService = new TransferEnabledBanksService();

// Auto-refresh cache daily (background, non-blocking)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    transferEnabledBanksService.refreshTransferEnabledBanks('ZA').catch(error => {
      console.error('❌ Auto-refresh of transfer-enabled banks failed:', error);
    });
  }, 24 * 60 * 60 * 1000); // 24 hours
}
