#!/bin/bash

# Production Deployment Script
# This script automates the deployment process with best practices

set -e  # Exit on any error

# Configuration
APP_NAME="connectsa"
PRODUCTION_URL="https://your-domain.com"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if we're on main branch
    if [ "$(git branch --show-current)" != "main" ]; then
        error "Must be on main branch to deploy"
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        error "Uncommitted changes detected. Please commit or stash them."
    fi
    
    # Check if tests pass
    log "🧪 Running tests..."
    if ! npm run test:unit; then
        error "Unit tests failed"
    fi
    
    # Check if build succeeds
    log "🏗️ Testing build..."
    if ! npm run build; then
        error "Build failed"
    fi
    
    success "Pre-deployment checks passed"
}

# Environment validation
validate_environment() {
    log "🔧 Validating environment configuration..."
    
    # Check required environment variables
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "JWT_SECRET"
        "RESEND_API_KEY"
        "PAYSTACK_SECRET_KEY"
        "PAYSTACK_PUBLIC_KEY"
    )

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
    fi
done

    # Validate DATABASE_URL format
    if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
        error "DATABASE_URL must be a PostgreSQL connection string"
    fi
    
    # Validate NODE_ENV
    if [ "$NODE_ENV" != "production" ]; then
        warning "NODE_ENV is not set to 'production'"
    fi
    
    success "Environment validation passed"
}

# Database operations
database_operations() {
    log "🗄️ Performing database operations..."
    
    # Create backup
    log "📦 Creating database backup..."
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # Extract database connection details
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    
    # Create backup (if pg_dump is available)
    if command -v pg_dump &> /dev/null; then
        PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p') \
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
        success "Database backup created: $BACKUP_FILE"
    else
        warning "pg_dump not available, skipping backup"
    fi

# Generate Prisma client
    log "🔧 Generating Prisma client..."
npx prisma generate

    # Deploy migrations
    log "📊 Deploying database migrations..."
npx prisma migrate deploy

    # Verify database sync
    log "🔍 Verifying database synchronization..."
    npm run db:sync
    
    success "Database operations completed"
}

# Application deployment
deploy_application() {
    log "🚀 Deploying application..."
    
    # Install dependencies
    log "📦 Installing dependencies..."
    npm ci --production
    
    # Build application
    log "🏗️ Building application..."
npm run build

    # Restart application (if using PM2)
    if command -v pm2 &> /dev/null; then
        log "🔄 Restarting application with PM2..."
        pm2 restart "$APP_NAME" || pm2 start npm --name "$APP_NAME" -- start
    else
        log "⚠️ PM2 not found, manual restart required"
    fi
    
    success "Application deployed"
}

# Post-deployment verification
post_deployment_verification() {
    log "✅ Running post-deployment verification..."
    
    # Wait for application to start
    log "⏳ Waiting for application to start..."
    sleep 10
    
    # Test health endpoint
    log "🏥 Testing health endpoint..."
    if curl -f -s "$PRODUCTION_URL/api/health" > /dev/null; then
        success "Health endpoint responding"
    else
        error "Health endpoint not responding"
    fi
    
    # Test environment endpoint
    log "🔧 Testing environment endpoint..."
    ENV_RESPONSE=$(curl -s "$PRODUCTION_URL/api/debug/environment")
    if echo "$ENV_RESPONSE" | grep -q "production"; then
        success "Environment endpoint responding correctly"
    else
        error "Environment endpoint not responding correctly"
    fi
    
    # Run comprehensive verification
    log "🔍 Running comprehensive verification..."
    if npm run verify:production "$PRODUCTION_URL"; then
        success "Comprehensive verification passed"
    else
        error "Comprehensive verification failed"
    fi
    
    success "Post-deployment verification completed"
}

# Rollback function
rollback() {
    log "🚨 Rollback initiated..."
    
    # Restore database backup
    if [ -f "$BACKUP_FILE" ]; then
        log "📦 Restoring database backup..."
        PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p') \
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
    fi
    
    # Revert to previous commit
    log "🔄 Reverting to previous commit..."
    git checkout HEAD~1
    
    # Restart application
    if command -v pm2 &> /dev/null; then
        pm2 restart "$APP_NAME"
    fi
    
    success "Rollback completed"
}

# Main deployment function
main() {
    log "🚀 Starting production deployment..."
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --rollback)
                rollback
                exit 0
                ;;
            *)
                error "Unknown option $1"
                ;;
        esac
    done
    
    # Run deployment steps
    if [ "$SKIP_TESTS" != "true" ]; then
        pre_deployment_checks
    fi
    
    validate_environment
    database_operations
    deploy_application
    post_deployment_verification
    
    success "🎉 Production deployment completed successfully!"
    log "🌐 Application is live at: $PRODUCTION_URL"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"