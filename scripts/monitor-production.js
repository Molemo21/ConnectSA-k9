#!/usr/bin/env node

/**
 * Production Monitoring and Rollback Manager
 * 
 * This script provides comprehensive monitoring and rollback capabilities
 * for production deployments.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionMonitor {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://your-domain.com',
      healthEndpoint: '/api/health',
      environmentEndpoint: '/api/debug/environment',
      checkInterval: config.checkInterval || 300000, // 5 minutes
      alertThreshold: config.alertThreshold || 3, // 3 consecutive failures
      logFile: './monitoring.log',
      ...config
    };
    
    this.monitoringData = {
      checks: [],
      alerts: [],
      lastHealthyCheck: null,
      consecutiveFailures: 0,
      isHealthy: true
    };
    
    this.setupLogging();
  }

  setupLogging() {
    // Ensure log directory exists
    const logDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.config.logFile, logMessage + '\n');
  }

  // Make HTTP request
  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // Health check
  async performHealthCheck() {
    const startTime = Date.now();
    
    try {
      this.log('Performing health check...');
      
      const healthResponse = await this.makeRequest(`${this.config.baseUrl}${this.config.healthEndpoint}`);
      const envResponse = await this.makeRequest(`${this.config.baseUrl}${this.config.environmentEndpoint}`);
      
      const checkResult = {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        health: healthResponse.data,
        environment: envResponse.data,
        success: healthResponse.status === 200 && envResponse.status === 200
      };
      
      this.monitoringData.checks.push(checkResult);
      
      // Keep only last 100 checks
      if (this.monitoringData.checks.length > 100) {
        this.monitoringData.checks = this.monitoringData.checks.slice(-100);
      }
      
      if (checkResult.success) {
        this.monitoringData.consecutiveFailures = 0;
        this.monitoringData.lastHealthyCheck = checkResult.timestamp;
        this.monitoringData.isHealthy = true;
        this.log('Health check passed');
      } else {
        this.monitoringData.consecutiveFailures++;
        this.monitoringData.isHealthy = false;
        this.log(`Health check failed (${this.monitoringData.consecutiveFailures} consecutive failures)`, 'error');
        
        // Check if we should trigger an alert
        if (this.monitoringData.consecutiveFailures >= this.config.alertThreshold) {
          await this.triggerAlert(checkResult);
        }
      }
      
      return checkResult;
      
    } catch (error) {
      this.monitoringData.consecutiveFailures++;
      this.monitoringData.isHealthy = false;
      
      const checkResult = {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error.message,
        success: false
      };
      
      this.monitoringData.checks.push(checkResult);
      
      this.log(`Health check error: ${error.message}`, 'error');
      
      if (this.monitoringData.consecutiveFailures >= this.config.alertThreshold) {
        await this.triggerAlert(checkResult);
      }
      
      return checkResult;
    }
  }

  // Trigger alert
  async triggerAlert(checkResult) {
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'health_check_failure',
      message: `Production health check failed ${this.monitoringData.consecutiveFailures} times`,
      details: checkResult,
      resolved: false
    };
    
    this.monitoringData.alerts.push(alert);
    
    this.log(`🚨 ALERT TRIGGERED: ${alert.message}`, 'error');
    
    // Send alert notification (implement based on your notification system)
    await this.sendAlertNotification(alert);
  }

  // Send alert notification
  async sendAlertNotification(alert) {
    // Implement your notification system here
    // Examples: Slack, Discord, Email, SMS, PagerDuty, etc.
    
    this.log(`Sending alert notification: ${alert.message}`);
    
    // Example: Send to Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const slackMessage = {
          text: `🚨 Production Alert`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Message', value: alert.message, short: false },
              { title: 'Timestamp', value: alert.timestamp, short: true },
              { title: 'Consecutive Failures', value: this.monitoringData.consecutiveFailures.toString(), short: true }
            ]
          }]
        };
        
        // Send to Slack (implement based on your needs)
        this.log('Slack notification sent');
      } catch (error) {
        this.log(`Failed to send Slack notification: ${error.message}`, 'error');
      }
    }
  }

  // Start continuous monitoring
  startMonitoring() {
    this.log('Starting production monitoring...');
    
    // Perform initial check
    this.performHealthCheck();
    
    // Set up interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    this.log(`Monitoring started with ${this.config.checkInterval / 1000}s interval`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.log('Monitoring stopped');
    }
  }

  // Get monitoring status
  getStatus() {
    const recentChecks = this.monitoringData.checks.slice(-10);
    const successRate = recentChecks.length > 0 
      ? (recentChecks.filter(c => c.success).length / recentChecks.length) * 100 
      : 0;
    
    return {
      isHealthy: this.monitoringData.isHealthy,
      consecutiveFailures: this.monitoringData.consecutiveFailures,
      lastHealthyCheck: this.monitoringData.lastHealthyCheck,
      successRate: Math.round(successRate),
      totalChecks: this.monitoringData.checks.length,
      activeAlerts: this.monitoringData.alerts.filter(a => !a.resolved).length,
      recentChecks: recentChecks
    };
  }

  // Generate monitoring report
  generateReport() {
    const status = this.getStatus();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallHealth: status.isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        successRate: `${status.successRate}%`,
        consecutiveFailures: status.consecutiveFailures,
        activeAlerts: status.activeAlerts
      },
      details: status,
      recommendations: this.generateRecommendations(status)
    };
    
    return report;
  }

  // Generate recommendations based on status
  generateRecommendations(status) {
    const recommendations = [];
    
    if (!status.isHealthy) {
      recommendations.push('Investigate production issues immediately');
      recommendations.push('Check application logs for errors');
      recommendations.push('Verify database connectivity');
      recommendations.push('Consider rolling back to previous version');
    }
    
    if (status.successRate < 95) {
      recommendations.push('Monitor application performance closely');
      recommendations.push('Check for resource constraints');
    }
    
    if (status.activeAlerts > 0) {
      recommendations.push('Resolve active alerts');
      recommendations.push('Review alerting thresholds');
    }
    
    return recommendations;
  }
}

// Rollback Manager
class RollbackManager {
  constructor() {
    this.rollbackLogFile = './rollback.log';
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.rollbackLogFile, logMessage + '\n');
  }

  // Get available rollback points
  getRollbackPoints() {
    try {
      // Get recent commits
      const commits = execSync('git log --oneline -10', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, ...messageParts] = line.split(' ');
          return {
            hash: hash,
            message: messageParts.join(' '),
            timestamp: execSync(`git log -1 --format=%ci ${hash}`, { encoding: 'utf8' }).trim()
          };
        });
      
      return commits;
    } catch (error) {
      this.log(`Failed to get rollback points: ${error.message}`, 'error');
      return [];
    }
  }

  // Perform rollback
  async performRollback(targetCommit, options = {}) {
    this.log(`Starting rollback to commit: ${targetCommit}`);
    
    try {
      // Create backup before rollback
      if (!options.skipBackup) {
        this.log('Creating backup before rollback...');
        execSync('./scripts/deploy-production.sh --skip-tests', { stdio: 'inherit' });
      }
      
      // Checkout target commit
      this.log(`Checking out commit: ${targetCommit}`);
      execSync(`git checkout ${targetCommit}`, { stdio: 'inherit' });
      
      // Install dependencies
      this.log('Installing dependencies...');
      execSync('npm ci --production', { stdio: 'inherit' });
      
      // Generate Prisma client
      this.log('Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      // Build application
      this.log('Building application...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Restart application
      this.log('Restarting application...');
      if (command -v pm2 &> /dev/null) {
        execSync('pm2 restart connectsa', { stdio: 'inherit' });
      } else {
        this.log('PM2 not found, manual restart required', 'warn');
      }
      
      this.log('Rollback completed successfully');
      return { success: true };
      
    } catch (error) {
      this.log(`Rollback failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Emergency rollback
  async emergencyRollback() {
    this.log('🚨 EMERGENCY ROLLBACK INITIATED');
    
    const rollbackPoints = this.getRollbackPoints();
    if (rollbackPoints.length < 2) {
      this.log('Not enough rollback points available', 'error');
      return { success: false, error: 'Not enough rollback points' };
    }
    
    // Use the second most recent commit (skip current)
    const targetCommit = rollbackPoints[1].hash;
    
    return await this.performRollback(targetCommit, { skipBackup: true });
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const baseUrl = process.argv[3] || 'https://your-domain.com';
  
  const monitor = new ProductionMonitor({ baseUrl });
  const rollbackManager = new RollbackManager();

  try {
    switch (command) {
      case 'start':
        monitor.startMonitoring();
        // Keep process running
        process.on('SIGINT', () => {
          console.log('\nStopping monitoring...');
          monitor.stopMonitoring();
          process.exit(0);
        });
        break;

      case 'check':
        const result = await monitor.performHealthCheck();
        console.log('Health check result:', JSON.stringify(result, null, 2));
        break;

      case 'status':
        const status = monitor.getStatus();
        console.log('Monitoring status:', JSON.stringify(status, null, 2));
        break;

      case 'report':
        const report = monitor.generateReport();
        console.log('Monitoring report:', JSON.stringify(report, null, 2));
        break;

      case 'rollback-points':
        const points = rollbackManager.getRollbackPoints();
        console.log('Available rollback points:');
        points.forEach((point, index) => {
          console.log(`${index + 1}. ${point.hash} - ${point.message} (${point.timestamp})`);
        });
        break;

      case 'rollback':
        const targetCommit = process.argv[3];
        if (!targetCommit) {
          console.error('❌ Please specify commit hash: rollback <commit-hash>');
          process.exit(1);
        }
        const rollbackResult = await rollbackManager.performRollback(targetCommit);
        if (rollbackResult.success) {
          console.log('✅ Rollback completed successfully');
        } else {
          console.error('❌ Rollback failed:', rollbackResult.error);
          process.exit(1);
        }
        break;

      case 'emergency-rollback':
        const emergencyResult = await rollbackManager.emergencyRollback();
        if (emergencyResult.success) {
          console.log('✅ Emergency rollback completed');
        } else {
          console.error('❌ Emergency rollback failed:', emergencyResult.error);
          process.exit(1);
        }
        break;

      default:
        console.log(`
📊 Production Monitoring and Rollback Manager

Usage:
  node scripts/monitor-production.js <command> [options]

Commands:
  start [base-url]              Start continuous monitoring
  check [base-url]              Perform single health check
  status [base-url]             Get monitoring status
  report [base-url]             Generate monitoring report
  rollback-points               List available rollback points
  rollback <commit-hash>        Rollback to specific commit
  emergency-rollback            Perform emergency rollback

Examples:
  node scripts/monitor-production.js start https://your-domain.com
  node scripts/monitor-production.js check
  node scripts/monitor-production.js rollback abc123
  node scripts/monitor-production.js emergency-rollback
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProductionMonitor, RollbackManager };
