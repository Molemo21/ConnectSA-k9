/**
 * WebSocket Test Configuration
 * 
 * Centralized configuration for all WebSocket tests
 */

module.exports = {
  // Server configuration
  server: {
    url: process.env.SERVER_URL || 'http://localhost:3000',
    socketPath: '/api/socket',
    timeout: 15000
  },

  // Test data
  testData: {
    client: {
      id: 'test_client_' + Date.now(),
      role: 'CLIENT',
      name: 'Test Client'
    },
    provider: {
      id: 'test_provider_' + Date.now(),
      role: 'PROVIDER',
      name: 'Test Provider'
    },
    booking: {
      id: 'test_booking_' + Date.now(),
      service: { name: 'Test Service' },
      amount: 100,
      status: 'PENDING'
    }
  },

  // Performance test configuration
  performance: {
    concurrentConnections: parseInt(process.env.CONCURRENT_CONNECTIONS) || 50,
    eventsPerSecond: parseInt(process.env.EVENTS_PER_SECOND) || 10,
    testDuration: parseInt(process.env.TEST_DURATION) || 30000, // 30 seconds
    monitoringInterval: 1000 // 1 second
  },

  // Flow test configuration
  flow: {
    timeout: 10000,
    retryAttempts: 3
  },

  // Integration test configuration
  integration: {
    timeout: 15000,
    eventTimeout: 10000
  },

  // Expected performance thresholds
  thresholds: {
    connectionSuccessRate: 0.95, // 95%
    eventSuccessRate: 0.98, // 98%
    maxLatency: 1000, // 1 second
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    maxMemoryGrowth: 50 * 1024 * 1024 // 50MB
  },

  // Environment-specific settings
  environments: {
    development: {
      server: {
        url: 'http://localhost:3000'
      },
      performance: {
        concurrentConnections: 20,
        eventsPerSecond: 5
      }
    },
    staging: {
      server: {
        url: process.env.STAGING_URL || 'https://staging.example.com'
      },
      performance: {
        concurrentConnections: 100,
        eventsPerSecond: 20
      }
    },
    production: {
      server: {
        url: process.env.PRODUCTION_URL || 'https://api.example.com'
      },
      performance: {
        concurrentConnections: 500,
        eventsPerSecond: 100
      }
    }
  }
};
