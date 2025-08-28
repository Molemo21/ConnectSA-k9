#!/bin/bash

# Setup Test Environment for Escrow Payment System
# Run this script to prepare your environment for testing

echo "🚀 Setting up test environment for Escrow Payment System..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Paystack Test Keys (Replace with your actual test keys)
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Other configurations
NODE_ENV=development
EOF
    echo "✅ .env.local created. Please update with your actual values."
else
    echo "✅ .env.local already exists."
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if [ -z "$PAYSTACK_SECRET_KEY" ]; then
    echo "⚠️  PAYSTACK_SECRET_KEY not set. Please add it to .env.local"
fi

if [ -z "$PAYSTACK_PUBLIC_KEY" ]; then
    echo "⚠️  PAYSTACK_PUBLIC_KEY not set. Please add it to .env.local"
fi

if [ -z "$PAYSTACK_WEBHOOK_SECRET" ]; then
    echo "⚠️  PAYSTACK_WEBHOOK_SECRET not set. Please add it to .env.local"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check database connection
echo "🗄️  Checking database connection..."
if npx prisma db pull > /dev/null 2>&1; then
    echo "✅ Database connection successful."
else
    echo "❌ Database connection failed. Please check your DATABASE_URL."
    echo "💡 Make sure your database is running and accessible."
fi

# Run database migration
echo "🔄 Running database migration..."
if [ -f "scripts/migrate-escrow-payment-system.sql" ]; then
    echo "Found migration script. Please run it manually:"
    echo "psql -d your_database -f scripts/migrate-escrow-payment-system.sql"
else
    echo "⚠️  Migration script not found."
fi

# Create test directories
echo "📁 Creating test directories..."
mkdir -p __tests__/api
mkdir -p scripts

echo ""
echo "🎯 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your actual Paystack test keys"
echo "2. Run database migration: psql -d your_database -f scripts/migrate-escrow-payment-system.sql"
echo "3. Test the system: node scripts/test-escrow-payment-system.js"
echo "4. Run unit tests: npm test __tests__/api/escrow-payment-system.test.ts"
echo ""
echo "🔗 Useful links:"
echo "- Paystack Dashboard: https://dashboard.paystack.com"
echo "- Paystack Documentation: https://paystack.com/docs"
echo "- Testing Guide: TESTING_ESCROW_PAYMENT_SYSTEM.md"
echo ""
echo "Happy testing! 🧪"
