// Test script to verify feature flag in browser
console.log('🧪 Testing Feature Flag in Browser...');
console.log('NEXT_PUBLIC_CATALOGUE_PRICING_V1:', process.env.NEXT_PUBLIC_CATALOGUE_PRICING_V1);

// Test the feature flag function
import { useCataloguePricing } from '@/lib/feature-flags';
const isEnabled = useCataloguePricing();
console.log('useCataloguePricing():', isEnabled);

if (isEnabled) {
  console.log('✅ Feature flag is ENABLED - Service Packages section should appear');
} else {
  console.log('❌ Feature flag is DISABLED - Service Packages section will not appear');
}

