import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });
const envProdPath = resolve(process.cwd(), '.env.production');
config({ path: envProdPath });
const envLocalPath = resolve(process.cwd(), '.env.local');
config({ path: envLocalPath });

console.log('🔍 Production Frontend Sync Diagnosis & Fix\n');
console.log('='.repeat(70) + '\n');

async function diagnoseAndFix() {
  try {
    // Step 1: Check what's in the repository
    console.log('📋 Step 1: Checking Repository State\n');
    
    const latestCommit = execSync('git log --oneline -1', { encoding: 'utf-8' }).trim();
    console.log(`   Latest Commit: ${latestCommit}\n`);
    
    const serviceSelectionInRepo = execSync(
      'git show HEAD:components/book-service/ServiceSelection.tsx | grep -A 2 "Specialized Cleaning"',
      { encoding: 'utf-8' }
    ).trim();
    
    if (serviceSelectionInRepo.includes('Mobile Car Wash')) {
      console.log('   ✅ "Mobile Car Wash" is in the latest commit\n');
    } else {
      console.log('   ❌ "Mobile Car Wash" is NOT in the latest commit\n');
      console.log('   ⚠️  This means the code hasn\'t been committed yet.\n');
    }

    // Step 2: Check if there are uncommitted changes
    console.log('📋 Step 2: Checking for Uncommitted Changes\n');
    
    try {
      const uncommitted = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (uncommitted.trim()) {
        console.log('   ⚠️  Uncommitted changes found:\n');
        const changes = uncommitted.split('\n').filter(l => l.trim()).slice(0, 5);
        changes.forEach(change => console.log(`      ${change}`));
        if (uncommitted.split('\n').filter(l => l.trim()).length > 5) {
          console.log(`      ... and ${uncommitted.split('\n').filter(l => l.trim()).length - 5} more`);
        }
        console.log('\n   ⚠️  Production Vercel uses committed code, not working directory\n');
      } else {
        console.log('   ✅ No uncommitted changes\n');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check git status\n');
    }

    // Step 3: Verify database has Mobile Car Wash
    console.log('📋 Step 3: Verifying Production Database\n');
    
    if (!process.env.DATABASE_URL && !process.env.PROD_DATABASE_URL) {
      console.log('   ⚠️  DATABASE_URL not set - skipping database check\n');
      console.log('   💡 To check database, set DATABASE_URL or PROD_DATABASE_URL\n');
    } else {
      const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl
          }
        }
      });

      try {
        const cleaningCategory = await prisma.serviceCategory.findFirst({
          where: { name: 'Cleaning Services' },
          include: {
            services: {
              where: { 
                OR: [
                  { name: { contains: 'Car Wash', mode: 'insensitive' } },
                  { name: { contains: 'Mobile', mode: 'insensitive' } }
                ]
              },
              isActive: true
            }
          }
        });

        if (cleaningCategory?.services.some(s => s.name.includes('Car Wash') || s.name.includes('Mobile'))) {
          const carWash = cleaningCategory.services.find(s => 
            s.name.toLowerCase().includes('car wash') || s.name.toLowerCase().includes('mobile')
          );
          console.log(`   ✅ Mobile Car Wash found in database: ${carWash?.name}\n`);
        } else {
          console.log('   ❌ Mobile Car Wash NOT found in production database\n');
          console.log('   ⚠️  Database needs to be synced. Run the ensure-mobile-car-wash script.\n');
        }

        await prisma.$disconnect();
      } catch (error) {
        console.log('   ⚠️  Could not connect to database\n');
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    // Step 4: Summary and Recommendations
    console.log('='.repeat(70) + '\n');
    console.log('📊 DIAGNOSIS SUMMARY\n');
    console.log('Based on the checks above, here\'s what needs to happen:\n');
    
    console.log('🔧 FIX STEPS:\n');
    console.log('1. COMMIT AND PUSH ALL CHANGES\n');
    console.log('   If there are uncommitted changes:\n');
    console.log('   git add .');
    console.log('   git commit -m "fix: ensure Mobile Car Wash is in production frontend"');
    console.log('   git push origin main\n');
    
    console.log('2. VERIFY VERCEL DEPLOYMENT\n');
    console.log('   a. Go to Vercel Dashboard: https://vercel.com/dashboard');
    console.log('   b. Select your project');
    console.log('   c. Go to "Deployments" tab');
    console.log('   d. Find the latest deployment');
    console.log('   e. Check if it matches your latest commit (check commit hash)\n');
    
    console.log('3. TRIGGER VERCEL REDEPLOY (if needed)\n');
    console.log('   Option A - Via Vercel Dashboard:');
    console.log('   - Click "Redeploy" on the latest deployment');
    console.log('   - Or click "Deploy" → "Redeploy" → Select latest commit\n');
    
    console.log('   Option B - Via Git Push:');
    console.log('   - Make a small change (e.g., update a comment)');
    console.log('   - Commit and push to trigger auto-deploy\n');
    
    console.log('4. CLEAR BROWSER CACHE\n');
    console.log('   After Vercel redeploys:');
    console.log('   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    console.log('   - Or open in incognito/private window\n');
    
    console.log('5. VERIFY IN PRODUCTION\n');
    console.log('   - Visit: https://your-production-url.com/book-service');
    console.log('   - Select "Cleaning Services"');
    console.log('   - Click "Specialized Cleaning" tab');
    console.log('   - Verify "Mobile Car Wash" appears in the list\n');
    
    console.log('='.repeat(70) + '\n');
    console.log('💡 QUICK FIX COMMANDS:\n');
    console.log('   # Check current status');
    console.log('   git status');
    console.log('');
    console.log('   # If changes exist, commit and push');
    console.log('   git add .');
    console.log('   git commit -m "fix: sync frontend with database changes"');
    console.log('   git push origin main');
    console.log('');
    console.log('   # Vercel will auto-deploy (or trigger manually in dashboard)\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnoseAndFix()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
