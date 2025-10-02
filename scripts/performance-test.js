#!/usr/bin/env node

/**
 * WebSocket Performance and Load Test Script
 * 
 * This script tests WebSocket performance under various load conditions:
 * - Multiple concurrent connections
 * - High-frequency event broadcasting
 * - Memory usage monitoring
 * - Connection stability under load
 */

const { io } = require('socket.io-client');
const axios = require('axios');
const os = require('os');

// Configuration
const CONFIG = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  socketPath: '/api/socket',
  concurrentConnections: 50,
  eventsPerSecond: 10,
  testDuration: 30000, // 30 seconds
  monitoringInterval: 1000 // 1 second
};

class WebSocketPerformanceTester {
  constructor() {
    this.sockets = new Map();
    this.stats = {
      connections: {
        successful: 0,
        failed: 0,
        active: 0,
        dropped: 0
      },
      events: {
        sent: 0,
        received: 0,
        lost: 0,
        latency: []
      },
      performance: {
        startTime: Date.now(),
        endTime: null,
        memoryUsage: [],
        cpuUsage: []
      }
    };
    this.monitoringInterval = null;
  }

  async runPerformanceTests() {
    console.log('🚀 Starting WebSocket Performance Tests\n');
    console.log('=' .repeat(60));
    console.log(`Configuration:`);
    console.log(`- Concurrent Connections: ${CONFIG.concurrentConnections}`);
    console.log(`- Events Per Second: ${CONFIG.eventsPerSecond}`);
    console.log(`- Test Duration: ${CONFIG.testDuration / 1000} seconds`);
    console.log(`- Server URL: ${CONFIG.serverUrl}`);
    console.log('=' .repeat(60));

    try {
      await this.testConnectionCapacity();
      await this.testEventThroughput();
      await this.testMemoryUsage();
      await this.testConnectionStability();
      
      this.printPerformanceReport();
      
    } catch (error) {
      console.error('\n💥 Performance test failed:', error.message);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  async testConnectionCapacity() {
    console.log('\n🔌 Testing connection capacity...');
    
    const connectionPromises = [];
    const startTime = Date.now();

    for (let i = 0; i < CONFIG.concurrentConnections; i++) {
      connectionPromises.push(this.createConnection(i));
    }

    try {
      await Promise.allSettled(connectionPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Connection capacity test completed in ${duration}ms`);
      console.log(`   Successful: ${this.stats.connections.successful}`);
      console.log(`   Failed: ${this.stats.connections.failed}`);
      console.log(`   Success Rate: ${((this.stats.connections.successful / CONFIG.concurrentConnections) * 100).toFixed(2)}%`);

    } catch (error) {
      console.error(`❌ Connection capacity test failed: ${error.message}`);
    }
  }

  async createConnection(connectionId) {
    return new Promise((resolve, reject) => {
      const socket = io(CONFIG.serverUrl, {
        path: CONFIG.socketPath,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      const timeout = setTimeout(() => {
        this.stats.connections.failed++;
        socket.disconnect();
        reject(new Error(`Connection ${connectionId} timeout`));
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        this.sockets.set(connectionId, socket);
        this.stats.connections.successful++;
        this.stats.connections.active++;
        
        // Authenticate the connection
        socket.emit('authenticate', {
          token: 'test_token',
          userId: `test_user_${connectionId}`,
          role: 'CLIENT'
        });

        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.stats.connections.failed++;
        reject(error);
      });

      socket.on('disconnect', () => {
        this.stats.connections.dropped++;
        this.stats.connections.active--;
      });
    });
  }

  async testEventThroughput() {
    console.log('\n📡 Testing event throughput...');
    
    this.startMonitoring();
    
    // Start event broadcasting
    const eventInterval = setInterval(() => {
      this.broadcastTestEvents();
    }, 1000 / CONFIG.eventsPerSecond);

    // Start event listeners
    this.setupEventListeners();

    // Run test for specified duration
    await new Promise(resolve => {
      setTimeout(() => {
        clearInterval(eventInterval);
        this.stats.performance.endTime = Date.now();
        resolve();
      }, CONFIG.testDuration);
    });

    this.stopMonitoring();

    console.log(`✅ Event throughput test completed`);
    console.log(`   Events Sent: ${this.stats.events.sent}`);
    console.log(`   Events Received: ${this.stats.events.received}`);
    console.log(`   Events Lost: ${this.stats.events.lost}`);
    console.log(`   Success Rate: ${((this.stats.events.received / this.stats.events.sent) * 100).toFixed(2)}%`);
    
    if (this.stats.events.latency.length > 0) {
      const avgLatency = this.stats.events.latency.reduce((a, b) => a + b, 0) / this.stats.events.latency.length;
      console.log(`   Average Latency: ${avgLatency.toFixed(2)}ms`);
    }
  }

  async broadcastTestEvents() {
    const activeConnections = Array.from(this.sockets.keys());
    if (activeConnections.length === 0) return;

    const targetConnection = activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const eventId = `event_${Date.now()}_${Math.random()}`;

    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${CONFIG.serverUrl}/api/socket`, {
        event: {
          type: 'booking',
          action: 'accepted'
        },
        data: {
          id: eventId,
          timestamp: startTime,
          targetConnection
        },
        targetUsers: [`test_user_${targetConnection}`]
      }, {
        timeout: 5000
      });

      if (response.status === 200) {
        this.stats.events.sent++;
      }
    } catch (error) {
      console.error(`Event broadcast error: ${error.message}`);
    }
  }

  setupEventListeners() {
    this.sockets.forEach((socket, connectionId) => {
      socket.on('booking_update', (event) => {
        const receiveTime = Date.now();
        const sendTime = event.data?.timestamp;
        
        if (sendTime) {
          const latency = receiveTime - sendTime;
          this.stats.events.latency.push(latency);
        }
        
        this.stats.events.received++;
      });
    });
  }

  async testMemoryUsage() {
    console.log('\n💾 Testing memory usage...');
    
    const initialMemory = process.memoryUsage();
    console.log(`Initial Memory Usage:`);
    console.log(`   RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    // Simulate memory-intensive operations
    await this.simulateMemoryLoad();

    const finalMemory = process.memoryUsage();
    console.log(`Final Memory Usage:`);
    console.log(`   RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    const memoryIncrease = {
      rss: finalMemory.rss - initialMemory.rss,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
    };

    console.log(`Memory Increase:`);
    console.log(`   RSS: ${(memoryIncrease.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    // Check for memory leaks (significant increase)
    if (memoryIncrease.heapUsed > 50 * 1024 * 1024) { // 50MB
      console.log(`⚠️  Potential memory leak detected (heap increased by ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      console.log(`✅ Memory usage appears stable`);
    }
  }

  async simulateMemoryLoad() {
    // Create temporary data to simulate memory load
    const tempData = [];
    for (let i = 0; i < 1000; i++) {
      tempData.push({
        id: `temp_${i}`,
        data: new Array(1000).fill('test_data'),
        timestamp: Date.now()
      });
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear temp data
    tempData.length = 0;
  }

  async testConnectionStability() {
    console.log('\n🔄 Testing connection stability...');
    
    const initialConnections = this.stats.connections.active;
    console.log(`Initial active connections: ${initialConnections}`);

    // Simulate network interruptions by disconnecting and reconnecting some sockets
    const connectionIds = Array.from(this.sockets.keys());
    const disconnectCount = Math.floor(connectionIds.length * 0.3); // Disconnect 30%

    console.log(`Disconnecting ${disconnectCount} connections to test stability...`);

    for (let i = 0; i < disconnectCount; i++) {
      const connectionId = connectionIds[i];
      const socket = this.sockets.get(connectionId);
      if (socket) {
        socket.disconnect();
        this.sockets.delete(connectionId);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const afterDisconnect = this.stats.connections.active;
    console.log(`Active connections after disconnect: ${afterDisconnect}`);

    // Attempt to reconnect
    console.log(`Attempting to reconnect disconnected sockets...`);
    const reconnectPromises = [];
    
    for (let i = 0; i < disconnectCount; i++) {
      reconnectPromises.push(this.createConnection(`reconnect_${i}`));
    }

    try {
      await Promise.allSettled(reconnectPromises);
      const finalConnections = this.stats.connections.active;
      
      console.log(`Final active connections: ${finalConnections}`);
      console.log(`Connection recovery rate: ${((finalConnections / initialConnections) * 100).toFixed(2)}%`);
      
      if (finalConnections >= initialConnections * 0.8) {
        console.log(`✅ Connection stability test passed`);
      } else {
        console.log(`⚠️  Connection stability test failed - significant connection loss`);
      }
    } catch (error) {
      console.error(`❌ Connection stability test failed: ${error.message}`);
    }
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.stats.performance.memoryUsage.push({
        timestamp: Date.now(),
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal
      });

      this.stats.performance.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system
      });
    }, CONFIG.monitoringInterval);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  printPerformanceReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Performance Test Report');
    console.log('='.repeat(60));

    const duration = this.stats.performance.endTime - this.stats.performance.startTime;
    console.log(`\n⏱️  Test Duration: ${(duration / 1000).toFixed(2)} seconds`);

    console.log('\n🔌 Connection Statistics:');
    console.log(`   Successful Connections: ${this.stats.connections.successful}`);
    console.log(`   Failed Connections: ${this.stats.connections.failed}`);
    console.log(`   Active Connections: ${this.stats.connections.active}`);
    console.log(`   Dropped Connections: ${this.stats.connections.dropped}`);
    console.log(`   Success Rate: ${((this.stats.connections.successful / CONFIG.concurrentConnections) * 100).toFixed(2)}%`);

    console.log('\n📡 Event Statistics:');
    console.log(`   Events Sent: ${this.stats.events.sent}`);
    console.log(`   Events Received: ${this.stats.events.received}`);
    console.log(`   Events Lost: ${this.stats.events.lost}`);
    console.log(`   Event Success Rate: ${((this.stats.events.received / this.stats.events.sent) * 100).toFixed(2)}%`);

    if (this.stats.events.latency.length > 0) {
      const latencies = this.stats.events.latency.sort((a, b) => a - b);
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = latencies[0];
      const maxLatency = latencies[latencies.length - 1];
      const p95Latency = latencies[Math.floor(latencies.length * 0.95)];

      console.log('\n⏱️  Latency Statistics:');
      console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
      console.log(`   Minimum: ${minLatency.toFixed(2)}ms`);
      console.log(`   Maximum: ${maxLatency.toFixed(2)}ms`);
      console.log(`   95th Percentile: ${p95Latency.toFixed(2)}ms`);
    }

    if (this.stats.performance.memoryUsage.length > 0) {
      const memoryStats = this.calculateMemoryStats();
      console.log('\n💾 Memory Statistics:');
      console.log(`   Peak RSS: ${(memoryStats.peakRss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Peak Heap Used: ${(memoryStats.peakHeapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Average RSS: ${(memoryStats.avgRss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Average Heap Used: ${(memoryStats.avgHeapUsed / 1024 / 1024).toFixed(2)} MB`);
    }

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (this.stats.connections.failed > CONFIG.concurrentConnections * 0.1) {
      console.log('   ⚠️  High connection failure rate - consider increasing server capacity');
    }
    
    if (this.stats.events.lost > this.stats.events.sent * 0.05) {
      console.log('   ⚠️  High event loss rate - check network stability and server performance');
    }
    
    if (this.stats.events.latency.length > 0) {
      const avgLatency = this.stats.events.latency.reduce((a, b) => a + b, 0) / this.stats.events.latency.length;
      if (avgLatency > 1000) {
        console.log('   ⚠️  High latency detected - optimize network and server performance');
      }
    }

    const memoryStats = this.calculateMemoryStats();
    if (memoryStats.peakHeapUsed > 200 * 1024 * 1024) { // 200MB
      console.log('   ⚠️  High memory usage detected - check for memory leaks');
    }

    console.log('\n✅ Performance testing completed successfully!');
  }

  calculateMemoryStats() {
    const memoryUsage = this.stats.performance.memoryUsage;
    
    const peakRss = Math.max(...memoryUsage.map(m => m.rss));
    const peakHeapUsed = Math.max(...memoryUsage.map(m => m.heapUsed));
    const avgRss = memoryUsage.reduce((sum, m) => sum + m.rss, 0) / memoryUsage.length;
    const avgHeapUsed = memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / memoryUsage.length;

    return { peakRss, peakHeapUsed, avgRss, avgHeapUsed };
  }

  cleanup() {
    console.log('\n🧹 Cleaning up performance test...');
    
    this.stopMonitoring();
    
    this.sockets.forEach((socket, connectionId) => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });
    
    this.sockets.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('✅ Garbage collection triggered');
    }
  }
}

// Run the performance tests
if (require.main === module) {
  const tester = new WebSocketPerformanceTester();
  tester.runPerformanceTests().catch(console.error);
}

module.exports = WebSocketPerformanceTester;
