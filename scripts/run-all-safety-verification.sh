#!/bin/bash

# ============================================================================
# Master Production Safety Verification Script
# ============================================================================
#
# Runs all safety verification checks in sequence:
# 1. Local environment tests (Node.js)
# 2. Database permission verification (SQL)
# 3. Generates comprehensive report
#
# Usage: ./scripts/run-all-safety-verification.sh
# ============================================================================

set -e  # Exit on error

echo "=================================================================================="
echo "PRODUCTION SAFETY VERIFICATION - MASTER SCRIPT"
echo "=================================================================================="
echo ""
echo "This script runs all safety verification checks."
echo "All tests are SAFE and NON-DESTRUCTIVE."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================================================
# Step 1: Local Environment Tests
# ============================================================================

echo -e "${CYAN}================================================================================${NC}"
echo -e "${CYAN}Step 1: Running Local Environment Tests${NC}"
echo -e "${CYAN}================================================================================${NC}"
echo ""

if node scripts/verify-production-safety.js; then
    echo -e "${GREEN}✅ Local environment tests: PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Local environment tests: FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# ============================================================================
# Step 2: Database Permission Verification (if DATABASE_URL is set)
# ============================================================================

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Skipping database permission verification.${NC}"
    echo -e "${YELLOW}   To run database checks, set DATABASE_URL and run:${NC}"
    echo -e "${YELLOW}   psql \$DATABASE_URL -f scripts/verify-production-db-permissions.sql${NC}"
    echo -e "${YELLOW}   OR${NC}"
    echo -e "${YELLOW}   node scripts/verify-production-db-permissions.js${NC}"
    echo ""
else
    echo -e "${CYAN}================================================================================${NC}"
    echo -e "${CYAN}Step 2: Running Database Permission Verification${NC}"
    echo -e "${CYAN}================================================================================${NC}"
    echo ""
    
    # Try Node.js verification first (more portable)
    if command -v node &> /dev/null; then
        if node scripts/verify-production-db-permissions.js; then
            echo -e "${GREEN}✅ Database permission verification: PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ Database permission verification: FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    elif command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -f scripts/verify-production-db-permissions.sql; then
            echo -e "${GREEN}✅ Database permission verification: PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ Database permission verification: FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  Neither node nor psql found. Skipping database verification.${NC}"
    fi
    echo ""
fi

# ============================================================================
# Summary
# ============================================================================

echo "=================================================================================="
echo "VERIFICATION SUMMARY"
echo "=================================================================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}================================================================================${NC}"
    echo -e "${GREEN}✅ VERDICT: PRODUCTION SAFETY: VERIFIED${NC}"
    echo -e "${GREEN}================================================================================${NC}"
    echo ""
    echo "All safety guarantees are correctly enforced."
    exit 0
else
    echo -e "${RED}================================================================================${NC}"
    echo -e "${RED}❌ VERDICT: PRODUCTION SAFETY: UNSAFE${NC}"
    echo -e "${RED}================================================================================${NC}"
    echo ""
    echo "Security issues detected. Please review and fix before deploying."
    exit 1
fi
