// scripts/verify-production-migrations.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function verifyProductionMigrations() {
  const report = {
    timestamp: new Date().toISOString(),
    production: {},
    local: {},
    drift: {
      missingInProd: [],
      missingInLocal: [],
      conflicts: []
    },
    risks: []
  };

  try {
    console.log('🔍 Connecting to production database...');
    await prisma.$connect();
    console.log('✅ Connected\n');

    // Get applied migrations from production
    console.log('📊 Fetching production migration history...');
    const appliedMigrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count,
        started_at,
        logs
      FROM _prisma_migrations 
      WHERE finished_at IS NOT NULL 
      ORDER BY finished_at ASC
    `;
    
    report.production.applied = appliedMigrations;
    report.production.count = appliedMigrations.length;
    
    console.log(`✅ Found ${appliedMigrations.length} applied migrations in production\n`);

    // Get local migrations
    console.log('📁 Scanning local migration directories...');
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      throw new Error('prisma/migrations directory not found');
    }

    const localMigrations = fs.readdirSync(migrationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .filter(dirent => dirent.name !== 'production' && dirent.name !== '.git')
      .map(dirent => dirent.name)
      .sort();
    
    report.local.directories = localMigrations;
    report.local.count = localMigrations.length;
    
    console.log(`✅ Found ${localMigrations.length} local migration directories\n`);

    // Extract migration names (remove timestamp prefix for comparison)
    const appliedNames = appliedMigrations.map(m => m.migration_name);
    const localNames = localMigrations;

    // Detect drift
    report.drift.missingInProd = localNames.filter(m => !appliedNames.includes(m));
    report.drift.missingInLocal = appliedNames.filter(m => !localNames.includes(m));

    // Check for conflicts (same name, different content)
    for (const localName of localNames) {
      if (appliedNames.includes(localName)) {
        // Migration exists in both - should verify content matches
        const localPath = path.join(migrationsDir, localName, 'migration.sql');
        if (fs.existsSync(localPath)) {
          // Note: Full content comparison would require fetching from DB
          // For now, just note that it exists in both
        }
      }
    }

    // Risk assessment
    if (report.drift.missingInProd.length > 0) {
      report.risks.push({
        level: 'HIGH',
        message: `Found ${report.drift.missingInProd.length} local migrations not applied in production`,
        migrations: report.drift.missingInProd
      });
    }

    if (report.drift.missingInLocal.length > 0) {
      report.risks.push({
        level: 'CRITICAL',
        message: `Found ${report.drift.missingInLocal.length} production migrations missing from local`,
        migrations: report.drift.missingInLocal
      });
    }

    // Output report
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 PRODUCTION MIGRATION VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 PRODUCTION STATE:');
    console.log(`   Applied migrations: ${report.production.count}`);
    if (appliedMigrations.length > 0) {
      console.log('   Latest migration:', appliedMigrations[appliedMigrations.length - 1].migration_name);
      console.log('   Latest applied at:', appliedMigrations[appliedMigrations.length - 1].finished_at);
    }
    console.log('');

    console.log('📁 LOCAL STATE:');
    console.log(`   Migration directories: ${report.local.count}`);
    if (localMigrations.length > 0) {
      console.log('   Latest migration:', localMigrations[localMigrations.length - 1]);
    }
    console.log('');

    if (report.drift.missingInProd.length > 0) {
      console.log('⚠️  DRIFT DETECTED - Missing in Production:');
      report.drift.missingInProd.forEach(m => console.log(`   - ${m}`));
      console.log('');
    }

    if (report.drift.missingInLocal.length > 0) {
      console.log('🚨 CRITICAL - Missing in Local:');
      report.drift.missingInLocal.forEach(m => console.log(`   - ${m}`));
      console.log('');
    }

    if (report.risks.length === 0) {
      console.log('✅ No migration drift detected');
    } else {
      console.log('⚠️  RISKS IDENTIFIED:');
      report.risks.forEach(risk => {
        console.log(`   [${risk.level}] ${risk.message}`);
      });
    }

    // Save full report to file
    const reportPath = path.join(process.cwd(), 'production-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    report.error = error.message;
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyProductionMigrations()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
