#!/usr/bin/env node

/**
 * Comprehensive WebSocket Test Runner
 * 
 * This script runs all WebSocket tests in sequence:
 * 1. Basic flow tests
 * 2. Performance tests
 * 3. Integration tests
 * 4. Generates comprehensive test report
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  scripts: {
    flow: path.join(__dirname, 'test-websocket-flow.js'),
    performance: path.join(__dirname, 'performance-test.js'),
    integration: path.join(__dirname, 'integration-test.js')
  },
  timeout: 300000, // 5 minutes per test
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000'
};

class WebSocketTestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive WebSocket Test Suite\n');
    console.log('=' .repeat(80));
    console.log(`Server URL: ${TEST_CONFIG.serverUrl}`);
    console.log(`Start Time: ${this.results.startTime.toISOString()}`);
    console.log('=' .repeat(80));

    try {
      // Check if server is running
      await this.checkServerStatus();

      // Run all test suites
      await this.runTestSuite('Flow Tests', TEST_CONFIG.scripts.flow);
      await this.runTestSuite('Performance Tests', TEST_CONFIG.scripts.performance);
      await this.runTestSuite('Integration Tests', TEST_CONFIG.scripts.integration);

      // Generate final report
      this.results.endTime = new Date();
      this.generateFinalReport();

    } catch (error) {
      console.error('\n💥 Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async checkServerStatus() {
    console.log('\n🏥 Checking server status...');
    
    try {
      const { default: axios } = await import('axios');
      const response = await axios.get(`${TEST_CONFIG.serverUrl}/api/socket`, {
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Server is running and responding');
      } else {
        throw new Error('Server is not responding correctly');
      }
    } catch (error) {
      console.error('❌ Server check failed:', error.message);
      console.log('\n💡 Make sure to start the server first:');
      console.log('   npm run dev');
      throw new Error('Server is not available');
    }
  }

  async runTestSuite(suiteName, scriptPath) {
    console.log(`\n🧪 Running ${suiteName}...`);
    console.log('-'.repeat(60));

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          SERVER_URL: TEST_CONFIG.serverUrl
        }
      });

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        const result = {
          name: suiteName,
          passed: false,
          duration: Date.now() - startTime,
          error: 'Test timeout'
        };
        this.results.tests.push(result);
        this.results.summary.total++;
        this.results.summary.failed++;
        reject(new Error(`${suiteName} timed out`));
      }, TEST_CONFIG.timeout);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        
        const result = {
          name: suiteName,
          passed: code === 0,
          duration,
          exitCode: code,
          error: code !== 0 ? `Exit code: ${code}` : null
        };
        
        this.results.tests.push(result);
        this.results.summary.total++;
        
        if (code === 0) {
          this.results.summary.passed++;
          console.log(`✅ ${suiteName} completed successfully (${duration}ms)`);
        } else {
          this.results.summary.failed++;
          console.log(`❌ ${suiteName} failed (${duration}ms)`);
        }
        
        resolve();
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        const result = {
          name: suiteName,
          passed: false,
          duration: Date.now() - startTime,
          error: error.message
        };
        this.results.tests.push(result);
        this.results.summary.total++;
        this.results.summary.failed++;
        reject(new Error(`${suiteName} failed: ${error.message}`));
      });
    });
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));

    const totalDuration = this.results.endTime - this.results.startTime;
    console.log(`\n⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`📅 Start Time: ${this.results.startTime.toISOString()}`);
    console.log(`📅 End Time: ${this.results.endTime.toISOString()}`);

    console.log('\n📈 Test Summary:');
    console.log('-'.repeat(40));
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📊 Total: ${this.results.summary.total}`);
    console.log(`📊 Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`);

    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(60));
    
    this.results.tests.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      const duration = `${(test.duration / 1000).toFixed(2)}s`;
      console.log(`${index + 1}. ${status} ${test.name} (${duration})`);
      
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    // Performance analysis
    this.analyzePerformance();

    // Recommendations
    this.generateRecommendations();

    // Save report to file
    this.saveReportToFile();

    // Final status
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Your WebSocket implementation is production-ready! 🚀');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results and fix any issues.');
      process.exit(1);
    }
  }

  analyzePerformance() {
    console.log('\n⚡ Performance Analysis:');
    console.log('-'.repeat(40));
    
    const durations = this.results.tests.map(t => t.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log(`⏱️  Average Test Duration: ${(avgDuration / 1000).toFixed(2)}s`);
    console.log(`⚡ Fastest Test: ${(minDuration / 1000).toFixed(2)}s`);
    console.log(`🐌 Slowest Test: ${(maxDuration / 1000).toFixed(2)}s`);

    // Identify slow tests
    const slowTests = this.results.tests.filter(t => t.duration > avgDuration * 1.5);
    if (slowTests.length > 0) {
      console.log('\n🐌 Slow Tests (>1.5x average):');
      slowTests.forEach(test => {
        console.log(`   - ${test.name}: ${(test.duration / 1000).toFixed(2)}s`);
      });
    }
  }

  generateRecommendations() {
    console.log('\n💡 Recommendations:');
    console.log('-'.repeat(40));

    if (this.results.summary.failed > 0) {
      console.log('🔧 Fix Failed Tests:');
      const failedTests = this.results.tests.filter(t => !t.passed);
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }

    if (this.results.summary.passed === this.results.summary.total) {
      console.log('🎉 All tests passed! Your WebSocket implementation is ready for production.');
      console.log('📋 Next Steps:');
      console.log('   1. Deploy to staging environment');
      console.log('   2. Run tests in staging');
      console.log('   3. Monitor performance in production');
      console.log('   4. Set up monitoring and alerting');
    }

    // Performance recommendations
    const slowTests = this.results.tests.filter(t => t.duration > 30000); // 30s
    if (slowTests.length > 0) {
      console.log('⚡ Performance Optimizations:');
      console.log('   - Consider optimizing slow tests');
      console.log('   - Review server configuration');
      console.log('   - Check network latency');
    }

    console.log('\n📚 Documentation:');
    console.log('   - WebSocket Implementation Guide: WEBSOCKET_IMPLEMENTATION_GUIDE.md');
    console.log('   - Manual Testing Guide: scripts/manual-test-guide.md');
  }

  saveReportToFile() {
    const reportData = {
      timestamp: this.results.startTime.toISOString(),
      duration: this.results.endTime - this.results.startTime,
      summary: this.results.summary,
      tests: this.results.tests,
      serverUrl: TEST_CONFIG.serverUrl
    };

    const reportPath = path.join(__dirname, '..', 'test-results', 'websocket-test-report.json');
    const reportDir = path.dirname(reportPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run all tests
if (require.main === module) {
  const runner = new WebSocketTestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = WebSocketTestRunner;
