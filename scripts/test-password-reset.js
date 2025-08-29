#!/usr/bin/env node

/**
 * Test Password Reset System Script
 * 
 * This script tests the password reset functionality to ensure everything is working.
 * Run with: node scripts/test-password-reset.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function testPasswordResetSystem() {
  console.log('🧪 Testing Password Reset System...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test 1: Check if PasswordResetToken table exists
    console.log('\n1️⃣ Testing table existence...');
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'PasswordResetToken'
        ) as exists;
      `;
      
      if (tableExists[0].exists) {
        console.log('✅ PasswordResetToken table exists');
      } else {
        console.log('❌ PasswordResetToken table does not exist');
        console.log('💡 Run: node scripts/fix-password-reset-token.js');
        return;
      }
    } catch (error) {
      console.log('❌ Could not check table existence:', error.message);
      return;
    }
    
    // Test 2: Check table structure
    console.log('\n2️⃣ Testing table structure...');
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'PasswordResetToken'
        ORDER BY ordinal_position;
      `;
      
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      const expectedColumns = ['id', 'userId', 'token', 'expires', 'createdAt'];
      const actualColumns = columns.map(col => col.column_name);
      
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      if (missingColumns.length === 0) {
        console.log('✅ All required columns exist');
      } else {
        console.log('❌ Missing columns:', missingColumns);
      }
    } catch (error) {
      console.log('❌ Could not check table structure:', error.message);
    }
    
    // Test 3: Check foreign key constraint
    console.log('\n3️⃣ Testing foreign key constraint...');
    try {
      const constraints = await prisma.$queryRaw`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'PasswordResetToken' 
        AND constraint_type = 'FOREIGN KEY';
      `;
      
      if (constraints.length > 0) {
        console.log('✅ Foreign key constraint exists');
        constraints.forEach(constraint => {
          console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      } else {
        console.log('❌ No foreign key constraints found');
      }
    } catch (error) {
      console.log('❌ Could not check foreign key constraints:', error.message);
    }
    
    // Test 4: Check indexes
    console.log('\n4️⃣ Testing indexes...');
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'PasswordResetToken';
      `;
      
      if (indexes.length > 0) {
        console.log('✅ Indexes found:');
        indexes.forEach(index => {
          console.log(`  - ${index.indexname}`);
        });
      } else {
        console.log('❌ No indexes found');
      }
    } catch (error) {
      console.log('❌ Could not check indexes:', error.message);
    }
    
    // Test 5: Test token creation (dry run)
    console.log('\n5️⃣ Testing token creation (dry run)...');
    try {
      // Find a test user
      const testUser = await prisma.user.findFirst({
        select: { id: true, email: true, name: true }
      });
      
      if (testUser) {
        console.log(`✅ Found test user: ${testUser.email}`);
        
        // Generate a test token (but don't save it)
        const crypto = require('crypto');
        const testToken = crypto.randomBytes(32).toString('hex');
        const testExpires = new Date(Date.now() + 60 * 60 * 1000);
        
        console.log(`✅ Test token generated: ${testToken.substring(0, 8)}...`);
        console.log(`✅ Test expiration: ${testExpires.toISOString()}`);
        
        // Test if we can create a token (then delete it immediately)
        const testTokenRecord = await prisma.passwordResetToken.create({
          data: {
            userId: testUser.id,
            token: testToken,
            expires: testExpires,
          },
        });
        
        if (testTokenRecord) {
          console.log('✅ Token creation test successful');
          
          // Clean up test token
          await prisma.passwordResetToken.delete({
            where: { id: testTokenRecord.id }
          });
          console.log('✅ Test token cleaned up');
        }
      } else {
        console.log('⚠️ No test users found in database');
      }
    } catch (error) {
      console.log('❌ Token creation test failed:', error.message);
    }
    
    console.log('\n🎉 Password Reset System Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the forgot-password page in your browser');
    console.log('2. Check the console for generated reset links');
    console.log('3. Test the reset-password functionality');
    console.log('4. Verify the complete password reset flow');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPasswordResetSystem()
  .then(() => {
    console.log('\n🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
