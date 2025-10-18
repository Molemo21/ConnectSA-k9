import cron from 'node-cron';
import { validateSchema } from './validate-schema';
import { fixSchemaIssues } from './fix-schema-issues';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Schedule validation to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🕛 Running scheduled schema validation...');
  
  try {
    // Run validation
    const validationReport = await validateSchema();
    
    // If issues are found, attempt to fix them
    if (validationReport.issues.length > 0) {
      console.log('⚠️ Issues found, attempting fixes...');
      const fixReport = await fixSchemaIssues();
      
      // Save comprehensive report
      const report = {
        timestamp: new Date().toISOString(),
        initialValidation: validationReport,
        fixes: fixReport,
        summary: {
          issuesFound: validationReport.issues.length,
          issuesFixed: fixReport.fixes.length,
          remainingIssues: fixReport.validationAfterFixes.issues.length,
          status: fixReport.validationAfterFixes.issues.length === 0 ? '✅ HEALTHY' : '⚠️ REQUIRES ATTENTION'
        }
      };
      
      // Save report
      const reportPath = join(process.cwd(), 'reports', `daily-schema-health-${Date.now()}.json`);
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      // Log summary
      console.log('\n📊 Daily Schema Health Check Summary:');
      console.log(`- Issues Found: ${report.summary.issuesFound}`);
      console.log(`- Issues Fixed: ${report.summary.issuesFixed}`);
      console.log(`- Remaining Issues: ${report.summary.remainingIssues}`);
      console.log(`- Status: ${report.summary.status}`);
      console.log(`- Report saved to: ${reportPath}`);
      
    } else {
      console.log('✅ No issues found in daily schema health check');
    }
    
  } catch (error) {
    console.error('❌ Daily schema health check failed:', error);
    // Here you might want to add notification logic for critical failures
  }
});
