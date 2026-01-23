#!/usr/bin/env node

/**
 * User Deletion Implementation Verification Script
 * 
 * Verifies that all implementation files are in place and correctly structured.
 * This script does NOT require a database connection.
 * 
 * Usage:
 *   node scripts/verify-user-deletion-implementation.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, errorMessage) {
  if (condition) {
    checks.push({ name, status: '✅', message: 'PASSED' });
    passed++;
    console.log(`✅ ${name}`);
  } else {
    checks.push({ name, status: '❌', message: `FAILED: ${errorMessage}` });
    failed++;
    console.error(`❌ ${name}: ${errorMessage}`);
  }
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  check(
    description,
    exists,
    `File not found: ${filePath}`
  );
  return exists;
}

function checkFileContent(filePath, patterns, description) {
  if (!checkFileExists(filePath, description)) {
    return false;
  }
  
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  let allFound = true;
  patterns.forEach(pattern => {
    const found = typeof pattern === 'string' 
      ? content.includes(pattern)
      : pattern.test(content);
    
    if (!found) {
      allFound = false;
      check(
        `${description} - Contains: ${pattern}`,
        false,
        `Pattern not found: ${pattern}`
      );
    } else {
      check(
        `${description} - Contains: ${pattern}`,
        true,
        ''
      );
    }
  });
  
  return allFound;
}

console.log('='.repeat(80));
console.log('🔍 User Deletion Implementation Verification');
console.log('='.repeat(80));
console.log('');

// Check 1: Schema file has deletedAt field
checkFileContent(
  'prisma/schema.prisma',
  [
    'deletedAt',
    'DateTime?',
    '@@index([deletedAt])'
  ],
  'Schema file contains deletedAt field and index'
);

// Check 2: Migration file exists and is correct
checkFileContent(
  'prisma/migrations/20250125000000_add_user_deleted_at/migration.sql',
  [
    'ALTER TABLE "users" ADD COLUMN "deletedAt"',
    'CREATE INDEX "users_deletedAt_idx"'
  ],
  'Migration file contains correct SQL'
);

// Check 3: Service file exists and has key functions
checkFileContent(
  'lib/services/user-deletion-service.ts',
  [
    'export async function deleteUser',
    'export async function getUserDeletionPreview',
    'generateAnonymizedEmail',
    'calculateTransactionalCounts',
    'anonymizeUser',
    'deleteUserWithPolicy',
    'randomUUID',
    'example.invalid',
    'TransactionIsolationLevel.Serializable',
    'deletedAt',
    'User already anonymized',
    'P2025'
  ],
  'Service file contains all required functions and features'
);

// Check 4: Route file uses the service
checkFileContent(
  'app/api/admin/users/[id]/route.ts',
  [
    "import('@/lib/services/user-deletion-service')",
    'deleteUser',
    '@example.invalid',
    'P2034',
    'P2003'
  ],
  'Route file integrates with service and handles errors'
);

// Check 5: Test script exists
checkFileExists(
  'scripts/test-user-deletion.ts',
  'Test script exists'
);

// Check 6: Documentation files exist
checkFileExists(
  'USER_DELETION_DEPLOYMENT_GUIDE.md',
  'Deployment guide exists'
);

checkFileExists(
  'USER_DELETION_IMPLEMENTATION.md',
  'Implementation documentation exists'
);

checkFileExists(
  'USER_DELETION_DEPLOYMENT_SUMMARY.md',
  'Deployment summary exists'
);

// Check 7: Package.json has test script
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  check(
    'Package.json contains test:user-deletion script',
    packageJson.scripts && packageJson.scripts['test:user-deletion'],
    'test:user-deletion script not found in package.json'
  );
}

// Check 8: Service file imports are correct
if (checkFileExists('lib/services/user-deletion-service.ts', 'Service file exists')) {
  const serviceContent = fs.readFileSync(
    path.join(process.cwd(), 'lib/services/user-deletion-service.ts'),
    'utf8'
  );
  
  check(
    'Service imports prisma from @/lib/prisma',
    serviceContent.includes("import { prisma } from '@/lib/prisma'"),
    'Service should import prisma from @/lib/prisma'
  );
  
  check(
    'Service imports randomUUID from crypto',
    serviceContent.includes("import { randomUUID } from 'crypto'"),
    'Service should import randomUUID from crypto'
  );
  
  check(
    'Service uses example.invalid domain',
    serviceContent.includes('@example.invalid'),
    'Service should use example.invalid for anonymized emails'
  );
}

// Summary
console.log('');
console.log('='.repeat(80));
console.log('📊 Verification Summary');
console.log('='.repeat(80));
console.log(`Total Checks: ${checks.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(80));

if (failed > 0) {
  console.log('');
  console.log('❌ Some checks failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('');
  console.log('✅ All implementation checks passed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set up DATABASE_URL environment variable');
  console.log('2. Run: npm run db:migrate (for development)');
  console.log('3. Run: npm run test:user-deletion (to test)');
  console.log('4. Deploy to production using: npm run deploy');
  process.exit(0);
}
