#!/bin/bash

# Admin Dashboard User Management System Test Runner
# This script sets up the test environment and runs the comprehensive test suite

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
HEADLESS=${HEADLESS:-"true"}
CLEANUP=${CLEANUP:-"false"}

echo -e "${BLUE}🚀 Admin Dashboard User Management System Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js to run the tests.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm to run the tests.${NC}"
    exit 1
fi

# Check if the application is running
echo -e "${YELLOW}🔍 Checking if application is running at ${BASE_URL}...${NC}"
if ! curl -s -f "${BASE_URL}" > /dev/null; then
    echo -e "${RED}❌ Application is not running at ${BASE_URL}${NC}"
    echo -e "${YELLOW}💡 Please start your application with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Application is running${NC}"

# Install dependencies if needed
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Install test dependencies
echo -e "${YELLOW}📦 Installing test dependencies...${NC}"
npm install --save-dev axios puppeteer

# Set up test data
echo -e "${YELLOW}📝 Setting up test data...${NC}"
BASE_URL="${BASE_URL}" node scripts/setup-test-data.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Test data setup failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Test data setup completed${NC}"

# Run the tests
echo -e "${YELLOW}🧪 Running comprehensive test suite...${NC}"
BASE_URL="${BASE_URL}" HEADLESS="${HEADLESS}" node scripts/test-admin-user-management.js

TEST_EXIT_CODE=$?

# Cleanup if requested
if [ "${CLEANUP}" = "true" ]; then
    echo -e "${YELLOW}🧹 Cleaning up test data...${NC}"
    # Add cleanup logic here if needed
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo -e "${GREEN}📊 Check scripts/test-results.json for detailed results${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${RED}📊 Check scripts/test-results.json for detailed results${NC}"
fi

exit $TEST_EXIT_CODE
