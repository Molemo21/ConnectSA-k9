#!/usr/bin/env node

/**
 * Fix PasswordResetToken Table Script
 * 
 * This script creates the missing PasswordResetToken table that's needed
 * for the forgot password functionality.
 * 
 * Run with: node scripts/fix-password-reset-token.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function fixPasswordResetTokenTable() {
  console.log('🔧 Fixing PasswordResetToken table...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if the table already exists
    try {
      const existingTable = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'PasswordResetToken'
        ) as exists;
      `;
      
      if (existingTable[0].exists) {
        console.log('✅ PasswordResetToken table already exists');
        return;
      }
    } catch (error) {
      console.log('ℹ️ Could not check existing table, proceeding with creation...');
    }
    
    // Create the PasswordResetToken table
    console.log('🔄 Creating PasswordResetToken table...');
    
    await prisma.$executeRaw`
      CREATE TABLE "PasswordResetToken" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "PasswordResetToken" 
      ADD CONSTRAINT "PasswordResetToken_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `;
    
    // Add indexes for better performance
    await prisma.$executeRaw`
      CREATE INDEX "idx_password_reset_token_userId" ON "PasswordResetToken"("userId");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "idx_password_reset_token_token" ON "PasswordResetToken"("token");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "idx_password_reset_token_expires" ON "PasswordResetToken"("expires");
    `;
    
    console.log('✅ PasswordResetToken table created successfully');
    console.log('✅ Foreign key constraint added');
    console.log('✅ Performance indexes added');
    
    // Verify the table was created
    const tableInfo = await prisma.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'PasswordResetToken'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📋 Table structure:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating PasswordResetToken table:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Table already exists, this is fine');
    } else {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Make sure your database is running');
      console.log('2. Check your DATABASE_URL is correct');
      console.log('3. Ensure you have proper permissions');
      console.log('4. Try running the script again');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🏁 Script completed');
  }
}

// Run the fix
fixPasswordResetTokenTable()
  .then(() => {
    console.log('\n✅ PasswordResetToken table fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
