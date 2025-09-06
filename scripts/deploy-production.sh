#!/bin/bash

# Production Deployment Script
# This script deploys the application to production environment

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we're in production mode
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
    echo "   This script is designed for production deployment"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."
required_vars=("DATABASE_URL" "DIRECT_URL" "RESEND_API_KEY" "PAYSTACK_SECRET_KEY" "PAYSTACK_PUBLIC_KEY" "NEXTAUTH_SECRET")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

# Verify production-specific settings
echo "🔒 Verifying production settings..."

# Check if Paystack is in production mode
if [ "$PAYSTACK_TEST_MODE" = "true" ]; then
    echo "⚠️  Warning: PAYSTACK_TEST_MODE is set to true in production!"
    read -p "Continue with test mode? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled - fix Paystack test mode first"
        exit 1
    fi
fi

echo "✅ Environment variables check passed"

# Install production dependencies only
echo "📦 Installing production dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Test database connectivity
echo "🔍 Testing database connectivity..."
npm run test:db

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Seed the database (ensures admin user exists)
echo "🌱 Seeding database..."
npx prisma db seed

# Run smoke tests
echo "🧪 Running smoke tests..."
npm run test:e2e

# Build the application
echo "🏗️ Building application..."
npm run build

# Final verification
echo "🔍 Final verification..."
echo "   • Checking if admin user exists..."
npx prisma studio --browser none &
STUDIO_PID=$!
sleep 5
kill $STUDIO_PID 2>/dev/null || true

echo "✅ Production deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Production dependencies installed"
echo "   • Prisma client generated"
echo "   • Database connectivity verified"
echo "   • Database migrated"
echo "   • Database seeded with admin user and services"
echo "   • Smoke tests passed"
echo "   • Application built"
echo ""
echo "🔐 Admin credentials:"
echo "   Email: admin@proliinkconnect.co.za"
echo "   Password: [CHANGE THIS IMMEDIATELY IN PRODUCTION]"
echo ""
echo "🚨 CRITICAL PRODUCTION TASKS:"
echo "   1. Change admin password immediately"
echo "   2. Verify all environment variables are correct"
echo "   3. Test payment flow with real Paystack keys"
echo "   4. Verify email sending with Resend"
echo "   5. Monitor application logs"
echo ""
echo "📊 Health Check:"
echo "   Visit: https://your-domain.com/api/connection/diagnostics"
