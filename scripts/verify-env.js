#!/usr/bin/env node

/**
 * Environment Verification (READ-ONLY)
 * 
 * Validates that all required environment variables are set and properly formatted.
 * This is a single-purpose check that fails fast if validation fails.
 * 
 * Exit Codes:
 *   0 = Environment valid
 *   1 = Environment invalid (exits immediately)
 */

function verifyEnvironment() {
  console.log('🔧 Verifying environment configuration...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
  ];
  
  const missing = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

if (require.main === module) {
  verifyEnvironment();
}

module.exports = { verifyEnvironment };
