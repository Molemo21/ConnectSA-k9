#!/usr/bin/env node

/**
 * Check .env.development for Production Credentials
 * 
 * This script checks if .env.development contains production database indicators
 * and provides guidance on fixing it.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_INDICATORS = [
  'pooler.supabase.com',
  'aws-0-eu-west-1',
  'qdrktzqfeewwcktgltzy', // Production project ref
];

const envDevPath = path.join(process.cwd(), '.env.development');

console.log('🔍 Checking .env.development for production credentials...\n');

if (!fs.existsSync(envDevPath)) {
  console.log('✅ .env.development does not exist (OK)');
  console.log('   This is fine - you can create it with development credentials only.\n');
  process.exit(0);
}

try {
  const content = fs.readFileSync(envDevPath, 'utf8');
  
  // Check for production indicators
  const foundIndicators = PRODUCTION_INDICATORS.filter(indicator => 
    content.includes(indicator)
  );
  
  if (foundIndicators.length > 0) {
    console.log('❌ WARNING: .env.development contains production database indicators:\n');
    foundIndicators.forEach(indicator => {
      console.log(`   - ${indicator}`);
    });
    
    console.log('\n⚠️  SECURITY CONCERN:');
    console.log('   .env.development should ONLY contain development database credentials.');
    console.log('   Production credentials should NEVER be in local environment files.\n');
    
    console.log('📋 RECOMMENDED ACTIONS:');
    console.log('   1. Review .env.development file');
    console.log('   2. Ensure DATABASE_URL points to development database only');
    console.log('   3. Remove any production database URLs');
    console.log('   4. Use development Supabase project (not production)\n');
    
    console.log('💡 CORRECT FORMAT:');
    console.log('   DATABASE_URL="postgresql://postgres:<PASSWORD>@db.<DEV_PROJECT_REF>.supabase.co:5432/postgres"');
    console.log('   (Should NOT contain: pooler.supabase.com, aws-0-eu-west-1, qdrktzqfeewwcktgltzy)\n');
    
    process.exit(1);
  } else {
    console.log('✅ .env.development does not contain production indicators');
    console.log('   File appears to use development credentials only.\n');
    process.exit(0);
  }
} catch (error) {
  console.log(`⚠️  Could not read .env.development: ${error.message}`);
  console.log('   File may be gitignored or have permission issues.\n');
  process.exit(0);
}
