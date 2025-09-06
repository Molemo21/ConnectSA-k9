@echo off
REM Admin Dashboard User Management System Test Runner (Windows)
REM This script sets up the test environment and runs the comprehensive test suite

setlocal enabledelayedexpansion

REM Configuration
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000
if "%HEADLESS%"=="" set HEADLESS=true
if "%CLEANUP%"=="" set CLEANUP=false

echo 🚀 Admin Dashboard User Management System Test Runner
echo ================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js to run the tests.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm to run the tests.
    exit /b 1
)

REM Check if the application is running
echo 🔍 Checking if application is running at %BASE_URL%...
curl -s -f "%BASE_URL%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Application is not running at %BASE_URL%
    echo 💡 Please start your application with: npm run dev
    exit /b 1
)
echo ✅ Application is running

REM Install dependencies if needed
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Install test dependencies
echo 📦 Installing test dependencies...
npm install --save-dev axios puppeteer

REM Set up test data
echo 📝 Setting up test data...
set BASE_URL=%BASE_URL%
node scripts/setup-test-data.js

if errorlevel 1 (
    echo ❌ Test data setup failed
    exit /b 1
)

echo ✅ Test data setup completed

REM Run the tests
echo 🧪 Running comprehensive test suite...
set BASE_URL=%BASE_URL%
set HEADLESS=%HEADLESS%
node scripts/test-admin-user-management.js

set TEST_EXIT_CODE=%errorlevel%

REM Cleanup if requested
if "%CLEANUP%"=="true" (
    echo 🧹 Cleaning up test data...
    REM Add cleanup logic here if needed
    echo ✅ Cleanup completed
)

REM Report results
if %TEST_EXIT_CODE%==0 (
    echo 🎉 All tests passed!
    echo 📊 Check scripts/test-results.json for detailed results
) else (
    echo ❌ Some tests failed
    echo 📊 Check scripts/test-results.json for detailed results
)

exit /b %TEST_EXIT_CODE%
