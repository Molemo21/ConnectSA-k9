#!/usr/bin/env node

/**
 * Database Connection Check Script
 * 
 * This script helps diagnose database connection issues with Supabase.
 * Run with: node scripts/check-db.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...\n');
  
  // Check environment variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in environment variables');
    console.log('💡 Make sure you have a .env file with DATABASE_URL set');
    return;
  }
  
  console.log('✅ DATABASE_URL is configured');
  
  // Parse the URL to check its structure
  try {
    const url = new URL(databaseUrl);
    console.log(`📍 Database host: ${url.hostname}`);
    console.log(`🔌 Port: ${url.port}`);
    console.log(`🗄️ Database: ${url.pathname.slice(1)}`);
    
    if (url.hostname.includes('supabase.com')) {
      console.log('🌐 Supabase database detected');
      
      if (url.hostname.includes('pooler')) {
        console.log('⚠️ Using Supabase pooler connection');
        console.log('💡 If you have connection issues, try switching to direct connection');
      } else {
        console.log('✅ Using Supabase direct connection');
      }
    }
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    return;
  }
  
  // Test connection
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  
  try {
    console.log('\n🔄 Testing connection...');
    const startTime = Date.now();
    
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ Database connected successfully (${connectionTime}ms)`);
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);
    
    // Check if we can access the user table
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table accessible (${userCount} users found)`);
    } catch (tableError) {
      console.log('⚠️ User table not accessible:', tableError.message);
    }
    
  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    
    // Provide specific troubleshooting tips
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify your Supabase database is running');
      console.log('3. Check if your IP is whitelisted in Supabase');
      console.log('4. Try switching between pooler and direct connection');
      console.log('5. Verify your DATABASE_URL is correct');
      
      // Try alternative connection methods
      console.log('\n🔄 Trying alternative connection methods...');
      
      if (databaseUrl.includes('pooler.supabase.com:6543')) {
        // Create direct connection URL for Supabase
        const directUrl = databaseUrl
          .replace('pooler.supabase.com:6543', 'supabase.com:5432')
          .replace('?pgbouncer=true', '')
          .replace('&connection_limit=1', '')
          .replace('&pool_timeout=20', '');
        
        console.log('Trying direct connection:', directUrl);
        
        try {
          const directPrisma = new PrismaClient({
            datasources: { db: { url: directUrl } },
          });
          await directPrisma.$connect();
          console.log('✅ Direct connection successful!');
          console.log('💡 Consider updating your DATABASE_URL to use direct connection');
          console.log('\n🔧 Updated DATABASE_URL for direct connection:');
          console.log(`DATABASE_URL="${directUrl}"`);
          await directPrisma.$disconnect();
        } catch (directError) {
          console.log('❌ Direct connection also failed:', directError.message);
          
          // Try with SSL mode
          console.log('\n🔄 Trying with SSL mode...');
          const sslUrl = directUrl + '?sslmode=require';
          
          try {
            const sslPrisma = new PrismaClient({
              datasources: { db: { url: sslUrl } },
            });
            await sslPrisma.$connect();
            console.log('✅ SSL connection successful!');
            console.log('\n🔧 Updated DATABASE_URL for SSL connection:');
            console.log(`DATABASE_URL="${sslUrl}"`);
            await sslPrisma.$disconnect();
          } catch (sslError) {
            console.log('❌ SSL connection also failed:', sslError.message);
          }
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseConnection()
  .then(() => {
    console.log('\n🏁 Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 