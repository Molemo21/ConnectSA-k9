# 🧪 ConnectSA Test Suite

This directory contains comprehensive tests for the ConnectSA platform, covering unit tests, integration tests, and end-to-end tests.

## 📁 Test Structure

```
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   └── client-journey/           # Complete client journey tests
│       ├── 01-discovery-signup.spec.ts
│       ├── 02-service-browsing.spec.ts
│       ├── 03-booking-process.spec.ts
│       ├── 04-provider-selection.spec.ts
│       ├── 05-payment-processing.spec.ts
│       ├── 06-service-execution.spec.ts
│       ├── 07-post-service.spec.ts
│       └── 08-edge-cases.spec.ts
├── unit/                         # Unit tests (Jest)
├── integration/                  # Integration tests (Jest)
├── setup.ts                     # Test setup configuration
└── README.md                    # This file
```

## 🚀 Running Tests

### Prerequisites

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set up Test Database:**
   ```bash
   # Create test database
   createdb connectsa_test
   
   # Run migrations
   npm run db:migrate
   
   # Seed test data
   npm run db:seed
   ```

3. **Set Environment Variables:**
   ```bash
   # Copy .env.example to .env.test
   cp .env.example .env.test
   
   # Update test environment variables
   DATABASE_URL="postgresql://test:test@localhost:5432/connectsa_test"
   JWT_SECRET="test-jwt-secret"
   PAYSTACK_SECRET_KEY="sk_test_test_key"
   PAYSTACK_PUBLIC_KEY="pk_test_test_key"
   ```

### Running Different Test Types

#### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run specific unit test file
npm run test:unit -- tests/unit/auth.test.ts

# Run with watch mode
npm run test:unit -- --watch
```

#### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- tests/integration/booking.test.ts
```

#### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific E2E test file
npm run test:e2e -- tests/e2e/client-journey/01-discovery-signup.spec.ts
```

#### All Tests
```bash
# Run all tests (unit + integration + e2e)
npm run test:all
```

## 🎯 Test Coverage

### Client Journey E2E Tests

#### 1. Discovery & Sign-Up (`01-discovery-signup.spec.ts`)
- ✅ Landing page display
- ✅ Service categories and featured providers
- ✅ User registration flow
- ✅ Email verification
- ✅ Login/logout functionality
- ✅ Form validation
- ✅ Error handling

#### 2. Service Browsing (`02-service-browsing.spec.ts`)
- ✅ Client dashboard display
- ✅ Service search and filtering
- ✅ Service details view
- ✅ Booking history management
- ✅ Navigation between pages

#### 3. Booking Process (`03-booking-process.spec.ts`)
- ✅ Multi-step booking form
- ✅ Form validation
- ✅ Authentication flow
- ✅ Review step for unauthenticated users
- ✅ Login modal integration
- ✅ Form state management

#### 4. Provider Selection (`04-provider-selection.spec.ts`)
- ✅ Provider discovery interface
- ✅ Provider information display
- ✅ Ratings and reviews
- ✅ Provider selection (accept/decline)
- ✅ Navigation between providers
- ✅ Error handling

#### 5. Payment Processing (`05-payment-processing.spec.ts`)
- ✅ Payment page display
- ✅ Payment breakdown calculation
- ✅ Paystack integration
- ✅ Payment success/failure handling
- ✅ Escrow information
- ✅ Payment verification

#### 6. Service Execution (`06-service-execution.spec.ts`)
- ✅ Booking status updates
- ✅ Provider information display
- ✅ Service progress updates
- ✅ Messaging with provider
- ✅ Service completion notifications
- ✅ Job proof display

#### 7. Post-Service (`07-post-service.spec.ts`)
- ✅ Review submission
- ✅ Review validation
- ✅ Review display
- ✅ Provider rating updates
- ✅ Booking history
- ✅ Rebooking functionality

#### 8. Edge Cases (`08-edge-cases.spec.ts`)
- ✅ Network error handling
- ✅ Server error handling
- ✅ Payment failures
- ✅ Provider no-show
- ✅ Service disputes
- ✅ Session timeout
- ✅ Offline mode
- ✅ Form validation edge cases

## 🔧 Test Configuration

### Playwright Configuration (`playwright.config.ts`)
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL:** http://localhost:3000
- **Test Directory:** ./tests/e2e
- **Retries:** 2 on CI, 0 locally
- **Workers:** 1 on CI, auto locally
- **Reporter:** HTML, JSON, JUnit

### Jest Configuration (`jest.config.js`)
- **Environment:** Node.js
- **Transform:** TypeScript with ts-jest
- **Test Match:** Unit and integration tests
- **Coverage:** App, components, lib directories
- **Setup:** tests/setup.ts
- **Timeout:** 10 seconds

### Test Setup (`tests/setup.ts`)
- **Environment Variables:** Test-specific configuration
- **Polyfills:** TextEncoder/TextDecoder for Node.js
- **Timeout:** 30 seconds for integration tests

## 📊 Test Data

### Test Users
- **Client:** client@example.com / password123
- **Provider:** provider@example.com / password123
- **Admin:** admin@example.com / password123

### Test Services
- **Haircut Service:** Professional haircut service
- **Garden Services:** Landscaping and garden maintenance

### Test Bookings
- Various booking statuses for testing
- Different payment states
- Completed services for review testing

## 🐛 Debugging Tests

### E2E Test Debugging
```bash
# Run specific test in debug mode
npm run test:e2e:debug -- tests/e2e/client-journey/01-discovery-signup.spec.ts

# Run with browser dev tools
npm run test:e2e:headed -- tests/e2e/client-journey/01-discovery-signup.spec.ts

# Run with Playwright UI
npm run test:e2e:ui
```

### Unit/Integration Test Debugging
```bash
# Run with verbose output
npm run test:unit -- --verbose

# Run specific test with debug
npm run test:unit -- --testNamePattern="should create user" --verbose
```

### Common Issues

1. **Database Connection Issues:**
   - Ensure test database is running
   - Check DATABASE_URL in .env.test
   - Run migrations: `npm run db:migrate`

2. **Port Conflicts:**
   - Ensure port 3000 is available
   - Check for running dev servers
   - Kill existing processes: `lsof -ti:3000 | xargs kill`

3. **Test Timeouts:**
   - Increase timeout in test configuration
   - Check for slow API responses
   - Verify test data setup

## 📈 Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:unit"
```

## 🎯 Best Practices

### Writing Tests
1. **Use descriptive test names** that explain what is being tested
2. **Test one thing at a time** - each test should have a single responsibility
3. **Use proper test data** - create realistic test scenarios
4. **Clean up after tests** - reset database state between tests
5. **Mock external dependencies** - don't rely on external services

### Test Organization
1. **Group related tests** using describe blocks
2. **Use beforeEach/afterEach** for setup and cleanup
3. **Keep tests independent** - tests should not depend on each other
4. **Use meaningful assertions** - be specific about what you're testing

### Performance
1. **Run tests in parallel** when possible
2. **Use test databases** - don't test against production data
3. **Mock slow operations** - don't wait for real API calls
4. **Clean up resources** - close connections, clear caches

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [E2E Testing Guide](https://playwright.dev/docs/test-intro)

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Add appropriate test data
3. Update this README if needed
4. Ensure tests pass locally before committing
5. Add tests for new features

## 📞 Support

For test-related issues:
1. Check this README first
2. Look at existing test examples
3. Check the test configuration files
4. Ask the development team for help

---

**Last Updated:** December 2024  
**Test Suite Version:** 1.0  
**Maintainer:** Development Team













