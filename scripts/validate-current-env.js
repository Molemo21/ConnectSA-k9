#!/usr/bin/env node

/**
 * Validate current .env file to show what needs to be moved/changed
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_INDICATORS = {
  database: ['qdrktzqfeewwcktgltzy', 'pooler.supabase.com', 'aws-0-eu-west-1'],
  supabase: ['qdrktzqfeewwcktgltzy'],
  urls: ['app.proliinkconnect.co.za'],
};

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  
  return env;
}

function checkProduction(value, indicators) {
  if (!value) return false;
  return indicators.some(ind => value.includes(ind));
}

function main() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file does not exist');
    return;
  }
  
  const env = parseEnvFile(envPath);
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Current .env Analysis');
  console.log('='.repeat(80) + '\n');
  
  const issues = {
    production: [],
    correct: [],
    missing: [],
  };
  
  // Check critical variables
  const checks = [
    { key: 'NODE_ENV', expected: 'development', current: env.NODE_ENV },
    { key: 'DATABASE_URL', isProd: checkProduction(env.DATABASE_URL, PRODUCTION_INDICATORS.database) },
    { key: 'DIRECT_URL', isProd: checkProduction(env.DIRECT_URL, PRODUCTION_INDICATORS.database) },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', isProd: checkProduction(env.NEXT_PUBLIC_SUPABASE_URL, PRODUCTION_INDICATORS.supabase) },
    { key: 'NEXTAUTH_URL', isProd: checkProduction(env.NEXTAUTH_URL, PRODUCTION_INDICATORS.urls) },
    { key: 'NEXT_PUBLIC_APP_URL', isProd: checkProduction(env.NEXT_PUBLIC_APP_URL, PRODUCTION_INDICATORS.urls) },
    { key: 'COOKIE_DOMAIN', expected: 'localhost', current: env.COOKIE_DOMAIN },
  ];
  
  checks.forEach(({ key, expected, current, isProd }) => {
    if (isProd === true) {
      issues.production.push(key);
      console.error(`🚨 ${key}: Contains PRODUCTION values`);
      console.error(`   Current: ${env[key]?.substring(0, 70)}...`);
      console.error(`   Action: Change to development value\n`);
    } else if (expected && current !== expected) {
      issues.production.push(key);
      console.error(`🚨 ${key}: Wrong value`);
      console.error(`   Current: ${current}`);
      console.error(`   Expected: ${expected}\n`);
    } else if (env[key]) {
      issues.correct.push(key);
      console.log(`✅ ${key}: OK`);
      if (env[key].length < 50) {
        console.log(`   Value: ${env[key]}\n`);
      } else {
        console.log(`   Value: ${env[key].substring(0, 50)}...\n`);
      }
    } else {
      issues.missing.push(key);
      console.warn(`⚠️  ${key}: Not set\n`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 Summary');
  console.log('='.repeat(80));
  console.log(`🚨 Production values found: ${issues.production.length}`);
  console.log(`✅ Correct values: ${issues.correct.length}`);
  console.log(`⚠️  Missing values: ${issues.missing.length}`);
  console.log('='.repeat(80) + '\n');
  
  if (issues.production.length > 0) {
    console.error('⚠️  These values need to be changed for .env.development:');
    issues.production.forEach(key => console.error(`   - ${key}`));
    console.error('\n');
  }
}

main();
