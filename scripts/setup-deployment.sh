#!/bin/bash

# Quick Setup Script for Production Deployment
# This script sets up the deployment environment and validates everything is ready

set -e

echo "🚀 Setting up Production Deployment Environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js is installed: $(node --version)"

# Check if npm is installed
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm is installed: $(npm --version)"

# Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p database-backups
mkdir -p logs
print_success "Directories created"

# Make scripts executable
print_status "Making scripts executable..."
chmod +x scripts/*.sh scripts/*.js
print_success "Scripts made executable"

# Check if .env file exists
print_status "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_status "Creating development environment template..."
    npm run env:create development
    print_warning "Please update .env file with your development configuration"
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found"
    print_status "Creating production environment template..."
    npm run env:create production
    print_warning "Please update .env.production file with your production configuration"
fi

# Validate package.json scripts
print_status "Validating package.json scripts..."
if npm run --silent 2>/dev/null | grep -q "env:validate"; then
    print_success "Environment management scripts available"
else
    print_warning "Some scripts may not be available"
fi

# Test database connection (if DATABASE_URL is set)
if [ ! -z "$DATABASE_URL" ]; then
    print_status "Testing database connection..."
    if npm run db:sync > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_warning "Database connection failed - check your DATABASE_URL"
    fi
else
    print_warning "DATABASE_URL not set - skipping database test"
fi

# Display available commands
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Available commands:"
echo ""
echo "Environment Management:"
echo "  npm run env:create production     - Create production environment template"
echo "  npm run env:validate production    - Validate environment configuration"
echo "  npm run env:generate-secrets       - Generate secure production secrets"
echo "  npm run env:security-check production - Check for security issues"
echo ""
echo "Database Operations:"
echo "  npm run db:backup                  - Create database backup"
echo "  npm run db:validate                - Validate database schema"
echo "  npm run db:full-migrate            - Safe migration with backup"
echo "  npm run db:cleanup 7               - Clean up old backups"
echo ""
echo "Deployment:"
echo "  npm run deploy:production          - Full production deployment"
echo "  npm run verify:production <url>    - Verify deployment"
echo "  npm run health:check               - Quick health check"
echo ""
echo "Monitoring & Rollback:"
echo "  npm run monitor:start <url>        - Start continuous monitoring"
echo "  npm run monitor:status             - Get monitoring status"
echo "  npm run rollback:points             - List rollback points"
echo "  npm run rollback:emergency          - Emergency rollback"
echo ""
echo "📖 For detailed instructions, see: COMPLETE_DEPLOYMENT_GUIDE.md"
echo ""
echo "🚀 Ready for production deployment!"
