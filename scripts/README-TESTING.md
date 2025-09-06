# Admin Dashboard User Management System - Test Suite

This comprehensive test suite validates all aspects of the enhanced Admin Dashboard User Management system, including APIs, frontend functionality, security, and user experience.

## 🎯 Test Coverage

### API Tests
- ✅ **User List Management**
  - List all users with pagination
  - Filter users by role (CLIENT, PROVIDER, ADMIN)
  - Search users by name/email/phone
  - Verify proper pagination and response structure

- ✅ **User Details**
  - Get detailed user information
  - Include provider information when applicable
  - Handle non-existent users properly

- ✅ **User Actions**
  - Suspend/unsuspend users
  - Change user roles
  - Soft delete users
  - Prevent self-modification
  - Validate role change logic

- ✅ **Audit Logging**
  - Verify all admin actions are logged
  - Test audit log filtering and pagination
  - Check audit log details and metadata

### Frontend Tests
- ✅ **User Management Interface**
  - Load user management page
  - Display user statistics cards
  - Test search functionality
  - Test role filtering
  - Verify user cards/rows display

- ✅ **User Interactions**
  - Open user details modal
  - Test action dropdown menus
  - Verify modal functionality
  - Test responsive design (mobile/desktop)

- ✅ **Navigation**
  - Test admin navigation tabs
  - Verify proper routing
  - Check mobile bottom navigation

### Security Tests
- ✅ **Access Control**
  - Non-admin users cannot access admin APIs
  - Providers cannot access admin APIs
  - Invalid tokens are rejected
  - No token access is blocked

- ✅ **Safety Features**
  - Admins cannot modify themselves
  - Soft delete prevents data loss
  - Active booking protection

### Email Notification Tests
- ✅ **Notification System**
  - Suspend/unsuspend notifications
  - Role change notifications
  - Account deletion notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Application running on `http://localhost:3000`
- Database with proper schema

### Installation

1. **Install test dependencies:**
   ```bash
   npm install --save-dev axios puppeteer
   ```

2. **Make scripts executable (Linux/Mac):**
   ```bash
   chmod +x scripts/run-admin-tests.sh
   ```

### Running Tests

#### Option 1: Automated Test Runner (Recommended)

**Linux/Mac:**
```bash
./scripts/run-admin-tests.sh
```

**Windows:**
```cmd
scripts\run-admin-tests.bat
```

#### Option 2: Manual Execution

1. **Set up test data:**
   ```bash
   BASE_URL=http://localhost:3000 node scripts/setup-test-data.js
   ```

2. **Run the test suite:**
   ```bash
   BASE_URL=http://localhost:3000 HEADLESS=true node scripts/test-admin-user-management.js
   ```

#### Option 3: Individual Test Components

```bash
# API tests only
node scripts/test-admin-user-management.js --api-only

# Frontend tests only  
node scripts/test-admin-user-management.js --frontend-only

# Security tests only
node scripts/test-admin-user-management.js --security-only
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | Application base URL |
| `HEADLESS` | `true` | Run browser in headless mode |
| `CLEANUP` | `false` | Clean up test data after tests |

### Test Configuration

Edit `scripts/test-config.json` to customize:
- Test user credentials
- Timeout settings
- Viewport configurations
- Expected status codes

## 📊 Test Results

### Console Output
The test suite provides real-time feedback with:
- ✅ **PASS** indicators for successful tests
- ❌ **FAIL** indicators with error details
- 📊 **Summary statistics** at the end

### Detailed Report
A comprehensive JSON report is generated at `scripts/test-results.json` containing:
- Test execution timestamp
- Pass/fail statistics
- Detailed results for each test
- Error messages and debugging information

### Sample Output
```
🚀 Starting Admin Dashboard User Management System Tests
📍 Testing against: http://localhost:3000
🎭 Headless mode: true

============================================================
🧪 SETUP: Creating Test Data
============================================================
✅ PASS: Create admin user
✅ PASS: Create provider user
✅ PASS: Create client user

============================================================
🧪 API TESTS: User List Management
============================================================
✅ PASS: List all users (admin)
✅ PASS: List users with pagination
✅ PASS: Filter users by role (CLIENT)
✅ PASS: Search users by email
✅ PASS: Non-admin access blocked

📊 Test Results Summary:
   Total Tests: 45
   Passed: 43 ✅
   Failed: 2 ❌
   Pass Rate: 95.6%
```

## 🧪 Test Data

### Test Users Created
- **Admin User**: `admin@test.com` / `admin123`
- **Provider User**: `provider@test.com` / `provider123`
- **Client User**: `client@test.com` / `client123`
- **Additional test users** for comprehensive testing

### Test Services
- Plumbing services
- Electrical services
- Cleaning services

### Test Bookings
- Sample bookings with different statuses
- Various amounts and durations
- Different client-provider combinations

## 🔧 Troubleshooting

### Common Issues

1. **Application not running**
   ```
   ❌ Application is not running at http://localhost:3000
   💡 Please start your application with: npm run dev
   ```
   **Solution**: Start your application first

2. **Database connection issues**
   ```
   ❌ Failed to create user: Database connection failed
   ```
   **Solution**: Ensure database is running and accessible

3. **Permission errors (Linux/Mac)**
   ```
   Permission denied: ./scripts/run-admin-tests.sh
   ```
   **Solution**: Make script executable: `chmod +x scripts/run-admin-tests.sh`

4. **Puppeteer installation issues**
   ```
   ❌ Failed to launch browser
   ```
   **Solution**: Install system dependencies for Puppeteer

### Debug Mode

Run tests with verbose output:
```bash
DEBUG=true BASE_URL=http://localhost:3000 node scripts/test-admin-user-management.js
```

### Headless Mode

To see browser interactions:
```bash
HEADLESS=false BASE_URL=http://localhost:3000 node scripts/test-admin-user-management.js
```

## 📝 Test Maintenance

### Adding New Tests

1. **API Tests**: Add new test functions in the appropriate section
2. **Frontend Tests**: Add new Puppeteer interactions
3. **Security Tests**: Add new access control validations

### Updating Test Data

Edit `scripts/setup-test-data.js` to modify:
- Test user credentials
- Service data
- Booking scenarios

### Customizing Assertions

Modify the `logTest()` function calls to adjust:
- Success criteria
- Error message formatting
- Test result tracking

## 🔒 Security Considerations

### Test Environment
- Tests use dedicated test user accounts
- No production data is affected
- Test data is isolated from real users

### Data Cleanup
- Test data can be cleaned up after tests
- Sensitive information is not logged
- Database transactions are properly handled

## 📈 Performance Testing

### Load Testing
For performance testing, consider:
- Running tests with multiple concurrent users
- Testing with large datasets
- Measuring response times

### Memory Testing
Monitor memory usage during:
- Large user list operations
- Complex audit log queries
- Frontend rendering with many users

## 🤝 Contributing

### Adding New Test Cases
1. Follow the existing test structure
2. Use descriptive test names
3. Include proper error handling
4. Update this documentation

### Reporting Issues
When reporting test failures:
1. Include the full error output
2. Specify your environment (OS, Node.js version)
3. Attach the test results JSON file
4. Describe steps to reproduce

## 📚 Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Axios Documentation](https://axios-http.com/)
- [Node.js Testing Best Practices](https://nodejs.org/en/docs/guides/testing/)

---

**Note**: This test suite is designed to work with the current implementation of the Admin Dashboard User Management system. Ensure your application is up-to-date and all required APIs are implemented before running the tests.
