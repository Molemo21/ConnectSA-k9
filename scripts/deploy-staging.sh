#!/bin/bash

# Staging Deployment Script
# This script deploys the application to staging environment

set -e  # Exit on any error

echo "🚀 Starting staging deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."
required_vars=("DATABASE_URL" "DIRECT_URL" "RESEND_API_KEY" "PAYSTACK_SECRET_KEY" "PAYSTACK_PUBLIC_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations using DATABASE_URL only (ignore DIRECT_URL)
echo "🗄️ Running database migrations (pooler via DATABASE_URL)..."
DIRECT_URL= npx prisma migrate deploy --schema ./prisma/schema.prisma

# Seed the database using DATABASE_URL only (ignore DIRECT_URL)
echo "🌱 Seeding database (pooler via DATABASE_URL)..."
DIRECT_URL= npx prisma db seed

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Staging deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Dependencies installed"
echo "   • Prisma client generated"
echo "   • Database migrated"
echo "   • Database seeded with admin user and services"
echo "   • Tests passed"
echo "   • Application built"
echo ""
echo "🔐 Admin credentials (CHANGE IN PRODUCTION):"
echo "   Email: admin@proliinkconnect.co.za"
echo "   Password: AdminPass123!"
echo ""
echo "⚠️  IMPORTANT: Change admin password before going to production!"
