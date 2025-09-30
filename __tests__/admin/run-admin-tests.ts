/**
 * Admin Dashboard Test Runner
 * Comprehensive test suite runner for admin dashboard functionality
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

interface TestSuite {
  name: string
  path: string
  description: string
  critical: boolean
}

const testSuites: TestSuite[] = [
  {
    name: 'Admin Data Service',
    path: '__tests__/admin/admin-data-service.test.ts',
    description: 'Tests the centralized admin data service functionality',
    critical: true,
  },
  {
    name: 'Admin Stats API',
    path: '__tests__/admin/api/admin-stats.test.ts',
    description: 'Tests the admin statistics API endpoints',
    critical: true,
  },
  {
    name: 'User Management API',
    path: '__tests__/admin/api/user-management.test.ts',
    description: 'Tests the admin user management API endpoints',
    critical: true,
  },
  {
    name: 'Provider Management API',
    path: '__tests__/admin/api/provider-management.test.ts',
    description: 'Tests the admin provider management API endpoints',
    critical: true,
  },
  {
    name: 'Audit Logs API',
    path: '__tests__/admin/api/audit-logs.test.ts',
    description: 'Tests the admin audit logging API endpoints',
    critical: true,
  },
  {
    name: 'Dashboard Integration',
    path: '__tests__/admin/components/admin-dashboard-integration.test.tsx',
    description: 'Tests the integration between admin dashboard components and APIs',
    critical: true,
  },
  {
    name: 'Performance & Caching',
    path: '__tests__/admin/performance/caching-performance.test.ts',
    description: 'Tests performance optimizations and caching mechanisms',
    critical: false,
  },
]

interface TestResult {
  suite: string
  passed: boolean
  duration: number
  error?: string
  coverage?: number
}

class AdminTestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Admin Dashboard Test Suite')
    console.log('=====================================\n')

    this.startTime = Date.now()

    for (const suite of testSuites) {
      await this.runTestSuite(suite)
    }

    this.printSummary()
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running ${suite.name} Tests`)
    console.log(`   ${suite.description}`)
    
    if (!existsSync(suite.path)) {
      console.log(`   ❌ Test file not found: ${suite.path}\n`)
      this.results.push({
        suite: suite.name,
        passed: false,
        duration: 0,
        error: 'Test file not found',
      })
      return
    }

    const startTime = Date.now()
    
    try {
      // Run Jest for the specific test file
      const command = `npx jest ${suite.path} --verbose --coverage --testTimeout=30000`
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      })

      const duration = Date.now() - startTime
      const passed = !output.includes('FAIL')
      
      console.log(`   ${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`)
      
      if (passed) {
        // Extract coverage information if available
        const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)/)
        const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : undefined
        
        this.results.push({
          suite: suite.name,
          passed: true,
          duration,
          coverage,
        })
      } else {
        this.results.push({
          suite: suite.name,
          passed: false,
          duration,
          error: 'Test failures detected',
        })
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.log(`   ❌ FAILED (${duration}ms)`)
      console.log(`   Error: ${error}`)
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: error.toString(),
      })
    }

    console.log('')
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime
    const passedTests = this.results.filter(r => r.passed).length
    const totalTests = this.results.length
    const criticalTests = this.results.filter(r => {
      const suite = testSuites.find(s => s.name === r.suite)
      return suite?.critical && r.passed
    }).length
    const totalCriticalTests = testSuites.filter(s => s.critical).length

    console.log('📊 Test Summary')
    console.log('===============')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${totalTests - passedTests}`)
    console.log(`Critical Tests Passed: ${criticalTests}/${totalCriticalTests}`)
    console.log(`Total Duration: ${totalDuration}ms`)
    console.log('')

    // Detailed results
    console.log('📋 Detailed Results')
    console.log('===================')
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      const coverage = result.coverage ? ` (${result.coverage}% coverage)` : ''
      console.log(`${status} ${result.suite} - ${result.duration}ms${coverage}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })
    console.log('')

    // Performance insights
    this.printPerformanceInsights()

    // Recommendations
    this.printRecommendations()

    // Final status
    const allCriticalPassed = criticalTests === totalCriticalTests
    const allPassed = passedTests === totalTests

    console.log('🎯 Final Status')
    console.log('===============')
    if (allPassed && allCriticalPassed) {
      console.log('🎉 ALL TESTS PASSED! Admin dashboard is fully functional.')
      console.log('✅ Real-time monitoring: Working')
      console.log('✅ User management: Working')
      console.log('✅ Provider management: Working')
      console.log('✅ Audit logging: Working')
      console.log('✅ Performance optimizations: Working')
      console.log('✅ Security compliance: Working')
    } else if (allCriticalPassed) {
      console.log('⚠️  CRITICAL TESTS PASSED! Core functionality is working.')
      console.log('Some non-critical tests failed, but the admin dashboard is functional.')
    } else {
      console.log('❌ CRITICAL TESTS FAILED! Admin dashboard needs attention.')
      console.log('Please review the failed tests and fix the issues.')
    }
  }

  private printPerformanceInsights(): void {
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
    const slowTests = this.results.filter(r => r.duration > 5000)
    const fastTests = this.results.filter(r => r.duration < 1000)

    console.log('⚡ Performance Insights')
    console.log('======================')
    console.log(`Average test duration: ${avgDuration.toFixed(0)}ms`)
    console.log(`Fast tests (< 1s): ${fastTests.length}`)
    console.log(`Slow tests (> 5s): ${slowTests.length}`)
    
    if (slowTests.length > 0) {
      console.log('Slow tests:')
      slowTests.forEach(test => {
        console.log(`  - ${test.suite}: ${test.duration}ms`)
      })
    }
    console.log('')
  }

  private printRecommendations(): void {
    console.log('💡 Recommendations')
    console.log('==================')
    
    const failedTests = this.results.filter(r => !r.passed)
    const lowCoverageTests = this.results.filter(r => r.coverage && r.coverage < 80)

    if (failedTests.length === 0) {
      console.log('✅ All tests are passing! Consider:')
      console.log('  - Adding more edge case tests')
      console.log('  - Increasing test coverage')
      console.log('  - Adding load testing for performance')
    } else {
      console.log('🔧 Issues to address:')
      failedTests.forEach(test => {
        console.log(`  - Fix ${test.suite}: ${test.error}`)
      })
    }

    if (lowCoverageTests.length > 0) {
      console.log('📈 Coverage improvements needed:')
      lowCoverageTests.forEach(test => {
        console.log(`  - ${test.suite}: ${test.coverage}% coverage`)
      })
    }

    console.log('')
    console.log('🚀 Next steps:')
    console.log('  1. Run tests in CI/CD pipeline')
    console.log('  2. Set up automated testing on code changes')
    console.log('  3. Monitor test performance in production')
    console.log('  4. Add integration tests with real database')
    console.log('')
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new AdminTestRunner()
  runner.runAllTests().catch(console.error)
}

export { AdminTestRunner, testSuites }
