#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps set up the proper environment variables for Prisma
 * with Supabase pooler and direct connections.
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration
# Prisma Client (Runtime) - Uses pooler for better performance
# IMPORTANT: Do not commit real credentials. Replace placeholders locally.
DATABASE_URL="postgresql://postgres:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5"
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# Direct Connection (Migrations) - Uses direct connection for schema changes
DIRECT_URL="postgresql://postgres:<password>@aws-0-eu-west-1.supabase.com:5432/postgres?sslmode=require"

# Application Configuration
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (optional)
# RESEND_API_KEY=your-resend-api-key
# EMAIL_FROM=noreply@yourapp.com

# Paystack (optional)
# PAYSTACK_SECRET_KEY=sk_test_xxx
# PAYSTACK_PUBLIC_KEY=pk_test_xxx
`;

const envPath = path.join(__dirname, '..', '.env');

try {
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists');
    console.log('📝 Please manually update your .env file with the following content:');
    console.log('\n' + '='.repeat(60));
    console.log(envContent);
    console.log('='.repeat(60));
    console.log('\n💡 Or run: cp scripts/.env.example .env');
  } else {
    // Create .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with proper database configuration');
  }
  
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npx prisma generate');
  console.log('2. Run: npx prisma migrate deploy');
  console.log('3. Restart your development server: npm run dev');
  
} catch (error) {
  console.error('❌ Error setting up environment:', error.message);
  process.exit(1);
}
