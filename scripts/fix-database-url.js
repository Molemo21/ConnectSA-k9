#!/usr/bin/env node

/**
 * Database URL Fix Script
 * 
 * This script helps you convert your Supabase pooler URL to a direct connection URL.
 * Run with: node scripts/fix-database-url.js
 */

require('dotenv').config();

function fixDatabaseUrl() {
  console.log('🔧 Fixing database connection URL...\n');
  
  // Get current DATABASE_URL
  const currentUrl = process.env.DATABASE_URL;
  
  if (!currentUrl) {
    console.error('❌ DATABASE_URL is not defined in environment variables');
    return;
  }
  
  console.log('📍 Current DATABASE_URL:');
  console.log(currentUrl);
  
  // Check if it's a pooler URL
  if (currentUrl.includes('pooler.supabase.com:6543')) {
    console.log('\n🔄 Converting pooler URL to direct connection...');
    
    // Convert pooler URL to direct URL
    let directUrl = currentUrl
      .replace('pooler.supabase.com:6543', 'supabase.com:5432')
      .replace('?pgbouncer=true', '')
      .replace('&connection_limit=1', '')
      .replace('&pool_timeout=20', '');
    
    // Add SSL mode if not present
    if (!directUrl.includes('sslmode=')) {
      directUrl += '?sslmode=require';
    }
    
    console.log('\n✅ Direct connection URL:');
    console.log(directUrl);
    
    console.log('\n🔧 Update your .env file with:');
    console.log('----------------------------------------');
    console.log(`DATABASE_URL="${directUrl}"`);
    console.log('----------------------------------------');
    
    // Also create a backup URL without SSL for testing
    const noSslUrl = directUrl.replace('?sslmode=require', '');
    if (noSslUrl !== directUrl) {
      console.log('\n💡 Alternative URL (without SSL):');
      console.log('----------------------------------------');
      console.log(`DATABASE_URL="${noSslUrl}"`);
      console.log('----------------------------------------');
    }
    
  } else if (currentUrl.includes('supabase.com:5432')) {
    console.log('\n✅ Already using direct connection!');
    console.log('If you\'re still having issues, check:');
    console.log('1. Your IP is whitelisted in Supabase');
    console.log('2. Your database is running');
    console.log('3. Your credentials are correct');
  } else {
    console.log('\n⚠️ Unknown URL format');
    console.log('Make sure you\'re using a Supabase connection string');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Copy the direct connection URL above');
  console.log('2. Update your .env file');
  console.log('3. Restart your development server');
  console.log('4. Test the connection with: node scripts/check-db.js');
}

// Run the fix
fixDatabaseUrl(); 