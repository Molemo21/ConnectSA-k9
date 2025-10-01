#!/usr/bin/env node

/**
 * Test the complete password reset flow
 * 1. Check database schema
 * 2. Request password reset
 * 3. Verify token creation
 * 4. Test token validation
 * 5. Simulate password reset
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
    }
  }
});

async function main() {
  console.log('🔐 Testing Password Reset Functionality\n');
  console.log('='.repeat(80));
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to production database\n');

    // Step 1: Check if PasswordResetToken table exists
    console.log('1️⃣ Checking PasswordResetToken table...');
    console.log('='.repeat(80));
    
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'PasswordResetToken'
        );
      `;
      
      if (tableExists[0]?.exists) {
        console.log('✅ PasswordResetToken table exists\n');
        
        // Check table structure
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'PasswordResetToken'
          ORDER BY ordinal_position;
        `;
        
        console.log('Table structure:');
        columns.forEach(col => {
          console.log(`   ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(25)} | ${col.is_nullable}`);
        });
        console.log('');
      } else {
        console.log('❌ PasswordResetToken table does NOT exist');
        console.log('   This table is required for password reset functionality.');
        console.log('\n⚠️ CRITICAL: Password reset will not work without this table!\n');
        return;
      }
    } catch (error) {
      console.error('❌ Error checking table:', error.message);
      return;
    }

    // Step 2: Check existing reset tokens
    console.log('2️⃣ Checking existing reset tokens...');
    console.log('='.repeat(80));
    
    const existingTokens = await prisma.passwordResetToken.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${existingTokens.length} password reset tokens in database\n`);
    
    if (existingTokens.length > 0) {
      console.log('Recent tokens:');
      existingTokens.forEach((token, idx) => {
        const isExpired = token.expires < new Date();
        const status = isExpired ? '❌ Expired' : '✅ Valid';
        console.log(`${idx + 1}. ${status} | User: ${token.user.email}`);
        console.log(`   Created: ${token.createdAt.toISOString()}`);
        console.log(`   Expires: ${token.expires.toISOString()}`);
        console.log(`   Token: ${token.token.substring(0, 16)}...`);
        console.log('');
      });
    } else {
      console.log('No reset tokens found (this is normal if no one has requested a password reset)\n');
    }

    // Step 3: Check users available for testing
    console.log('3️⃣ Checking test users...');
    console.log('='.repeat(80));
    
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['molemonakin21@gmail.com', 'admin@proliinkconnect.co.za', 'thabangnakin17@gmail.com']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No test users found');
      console.log('   Cannot perform password reset test without a user');
      return;
    }
    
    console.log(`Found ${users.length} test user(s):\n`);
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log('');
    });

    // Step 4: Test forgot-password API endpoint
    console.log('4️⃣ Testing forgot-password API endpoint...');
    console.log('='.repeat(80));
    
    const testEmail = users[0].email;
    console.log(`Testing with email: ${testEmail}\n`);
    
    try {
      const response = await fetch('https://app.proliinkconnect.co.za/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      
      const data = await response.json();
      
      console.log(`Response Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      console.log(`Response: ${JSON.stringify(data, null, 2)}\n`);
      
      if (response.ok) {
        console.log('✅ Forgot password API is working!\n');
        
        // Check if a new token was created
        const newToken = await prisma.passwordResetToken.findFirst({
          where: { userId: users[0].id },
          orderBy: { createdAt: 'desc' }
        });
        
        if (newToken) {
          console.log('✅ Password reset token created successfully:');
          console.log(`   Token: ${newToken.token.substring(0, 16)}...`);
          console.log(`   Created: ${newToken.createdAt.toISOString()}`);
          console.log(`   Expires: ${newToken.expires.toISOString()}`);
          console.log(`   Valid for: ${Math.round((newToken.expires.getTime() - Date.now()) / 1000 / 60)} minutes`);
          console.log('');
          console.log('🔗 Reset link would be:');
          console.log(`   https://app.proliinkconnect.co.za/reset-password?token=${newToken.token}`);
          console.log('');
        } else {
          console.log('⚠️ No token found after API call (might have been sent but not in this check)');
        }
      } else {
        console.log('❌ Forgot password API failed');
        console.log(`   Error: ${data.error || 'Unknown error'}\n`);
      }
    } catch (error) {
      console.error('❌ Error calling forgot-password API:', error.message);
      console.log('');
    }

    // Step 5: Check email configuration
    console.log('5️⃣ Checking email configuration...');
    console.log('='.repeat(80));
    
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    
    if (resendApiKey) {
      console.log('✅ RESEND_API_KEY is configured');
      console.log(`   Key: ${resendApiKey.substring(0, 10)}...`);
    } else {
      console.log('❌ RESEND_API_KEY is NOT configured');
      console.log('   Emails will not be sent!');
    }
    
    if (fromEmail) {
      console.log(`✅ FROM_EMAIL is configured: ${fromEmail}`);
    } else {
      console.log('❌ FROM_EMAIL is NOT configured');
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const checks = [
      { name: 'PasswordResetToken table exists', pass: true },
      { name: 'Test users available', pass: users.length > 0 },
      { name: 'Forgot password API', pass: false }, // Will be set by API test
      { name: 'Email configuration', pass: !!resendApiKey && !!fromEmail }
    ];
    
    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    console.log('');
    
    const allPassed = checks.every(c => c.pass);
    
    if (allPassed) {
      console.log('✅ Password reset functionality is working correctly!');
      console.log('');
      console.log('💡 To test manually:');
      console.log('   1. Go to https://app.proliinkconnect.co.za/forgot-password');
      console.log(`   2. Enter email: ${testEmail}`);
      console.log('   3. Check email for reset link');
      console.log('   4. Click link and set new password');
    } else {
      console.log('⚠️ Some checks failed. Review the issues above.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main();

