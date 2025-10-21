/**
 * Feature Flag System for Catalogue-based Pricing
 * 
 * This module provides a centralized way to manage feature flags
 * for the gradual rollout of catalogue-based pricing.
 */

export interface FeatureFlags {
  cataloguePricingV1: boolean;
  cataloguePricingBeta: boolean;
  cataloguePricingNewProviders: boolean;
  cataloguePricingExistingProviders: boolean;
  legacyPricingFallback: boolean;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags;

  private constructor() {
    this.flags = this.loadFlagsFromEnvironment();
  }

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private loadFlagsFromEnvironment(): FeatureFlags {
    return {
      cataloguePricingV1: process.env.NEXT_PUBLIC_CATALOGUE_PRICING_V1 === 'true',
      cataloguePricingBeta: process.env.NEXT_PUBLIC_CATALOGUE_PRICING_BETA === 'true',
      cataloguePricingNewProviders: process.env.NEXT_PUBLIC_CATALOGUE_PRICING_NEW_PROVIDERS === 'true',
      cataloguePricingExistingProviders: process.env.NEXT_PUBLIC_CATALOGUE_PRICING_EXISTING_PROVIDERS === 'true',
      legacyPricingFallback: process.env.NEXT_PUBLIC_LEGACY_PRICING_FALLBACK !== 'false', // Default to true
    };
  }

  /**
   * Check if catalogue pricing is enabled for the main feature
   */
  public isCataloguePricingEnabled(): boolean {
    return this.flags.cataloguePricingV1;
  }

  /**
   * Check if catalogue pricing is enabled for beta users
   */
  public isCataloguePricingBetaEnabled(): boolean {
    return this.flags.cataloguePricingBeta;
  }

  /**
   * Check if catalogue pricing should be used for new providers
   */
  public isCataloguePricingEnabledForNewProviders(): boolean {
    return this.flags.cataloguePricingNewProviders;
  }

  /**
   * Check if catalogue pricing should be used for existing providers
   */
  public isCataloguePricingEnabledForExistingProviders(): boolean {
    return this.flags.cataloguePricingExistingProviders;
  }

  /**
   * Check if legacy pricing should be used as fallback
   */
  public isLegacyPricingFallbackEnabled(): boolean {
    return this.flags.legacyPricingFallback;
  }

  /**
   * Check if a specific provider should use catalogue pricing
   */
  public shouldUseCataloguePricingForProvider(providerId: string, isNewProvider: boolean = false): boolean {
    // If main feature is disabled, return false
    if (!this.isCataloguePricingEnabled()) {
      return false;
    }

    // If it's a new provider and new provider flag is enabled
    if (isNewProvider && this.isCataloguePricingEnabledForNewProviders()) {
      return true;
    }

    // If it's an existing provider and existing provider flag is enabled
    if (!isNewProvider && this.isCataloguePricingEnabledForExistingProviders()) {
      return true;
    }

    return false;
  }

  /**
   * Check if a specific user should see catalogue pricing features
   */
  public shouldShowCataloguePricingToUser(userId: string, userRole: string): boolean {
    // Only show to clients and providers
    if (userRole !== 'CLIENT' && userRole !== 'PROVIDER') {
      return false;
    }

    // If beta is enabled, check if user is in beta group
    if (this.isCataloguePricingBetaEnabled()) {
      // Simple beta group check based on user ID hash
      const hash = this.simpleHash(userId);
      return hash % 10 < 3; // 30% of users get beta access
    }

    return this.isCataloguePricingEnabled();
  }

  /**
   * Get all current feature flags (for debugging/admin purposes)
   */
  public getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update feature flags (for admin purposes)
   */
  public updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
  }

  /**
   * Simple hash function for beta group assignment
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Convenience functions for common use cases
export const useCataloguePricing = (): boolean => {
  return FeatureFlagService.getInstance().isCataloguePricingEnabled();
};

export const useCataloguePricingForProvider = (providerId: string, isNewProvider: boolean = false): boolean => {
  return FeatureFlagService.getInstance().shouldUseCataloguePricingForProvider(providerId, isNewProvider);
};

export const shouldShowCataloguePricingToUser = (userId: string, userRole: string): boolean => {
  return FeatureFlagService.getInstance().shouldShowCataloguePricingToUser(userId, userRole);
};

export const getFeatureFlags = (): FeatureFlags => {
  return FeatureFlagService.getInstance().getAllFlags();
};

// React hook for frontend components
export const useFeatureFlags = () => {
  const flags = FeatureFlagService.getInstance().getAllFlags();
  
  return {
    cataloguePricing: flags.cataloguePricingV1,
    cataloguePricingBeta: flags.cataloguePricingBeta,
    cataloguePricingNewProviders: flags.cataloguePricingNewProviders,
    cataloguePricingExistingProviders: flags.cataloguePricingExistingProviders,
    legacyPricingFallback: flags.legacyPricingFallback,
  };
};

// Environment variable documentation
export const FEATURE_FLAG_ENV_VARS = {
  NEXT_PUBLIC_CATALOGUE_PRICING_V1: 'Enable main catalogue pricing feature',
  NEXT_PUBLIC_CATALOGUE_PRICING_BETA: 'Enable beta testing for catalogue pricing',
  NEXT_PUBLIC_CATALOGUE_PRICING_NEW_PROVIDERS: 'Enable catalogue pricing for new providers',
  NEXT_PUBLIC_CATALOGUE_PRICING_EXISTING_PROVIDERS: 'Enable catalogue pricing for existing providers',
  NEXT_PUBLIC_LEGACY_PRICING_FALLBACK: 'Enable fallback to legacy pricing (default: true)',
} as const;

