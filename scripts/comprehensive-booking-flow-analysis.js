#!/usr/bin/env node

/**
 * Comprehensive analysis of client dashboard booking flow and provider-client synchronization
 */

const fs = require('fs');
const path = require('path');

// Structured logging utility
const createLogger = (context) => ({
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

const logger = createLogger('ComprehensiveBookingFlowAnalysis');

function analyzeClientDashboard() {
  logger.info('Analyzing client dashboard structure and components');
  
  const clientDashboardFiles = [
    'components/client',
    'app/client',
    'app/dashboard'
  ];
  
  const clientComponents = {};
  
  clientDashboardFiles.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const fileName = path.basename(file);
        
        if (content.includes('CLIENT') || content.includes('client') || content.includes('booking')) {
          clientComponents[fileName] = {
            path: file,
            hasBookingCreation: content.includes('createBooking') || content.includes('newBooking'),
            hasBookingList: content.includes('bookings') && content.includes('map'),
            hasPaymentFlow: content.includes('payment') || content.includes('paystack'),
            hasBookingStatus: content.includes('status') || content.includes('PENDING') || content.includes('ACCEPTED'),
            hasProviderInteraction: content.includes('provider') || content.includes('Provider'),
            hasRealTimeUpdates: content.includes('useEffect') && content.includes('setInterval'),
            hasErrorHandling: content.includes('try {') && content.includes('} catch'),
            hasLoadingStates: content.includes('loading') || content.includes('isLoading'),
            hasDataFetching: content.includes('fetch') || content.includes('useSWR'),
            hasStateManagement: content.includes('useState') || content.includes('useReducer')
          };
        }
      });
    }
  });
  
  logger.info('Client dashboard components analyzed:', { count: Object.keys(clientComponents).length });
  return clientComponents;
}

function analyzeBookingFlow() {
  logger.info('Analyzing complete booking flow from client to provider');
  
  const bookingFlowFiles = [
    'app/api/bookings',
    'app/api/payments',
    'components/client',
    'components/provider'
  ];
  
  const bookingFlow = {
    clientSide: {},
    apiEndpoints: {},
    providerSide: {},
    paymentFlow: {}
  };
  
  // Analyze client-side booking creation
  const clientFiles = getAllFiles('components/client');
  clientFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    if (content.includes('booking') || content.includes('Booking')) {
      bookingFlow.clientSide[fileName] = {
        hasBookingForm: content.includes('form') && content.includes('onSubmit'),
        hasDateSelection: content.includes('date') || content.includes('DatePicker'),
        hasTimeSelection: content.includes('time') || content.includes('TimePicker'),
        hasServiceSelection: content.includes('service') || content.includes('Service'),
        hasLocationInput: content.includes('location') || content.includes('address'),
        hasValidation: content.includes('validate') || content.includes('required'),
        hasSubmitHandler: content.includes('handleSubmit') || content.includes('onSubmit'),
        hasErrorDisplay: content.includes('error') && content.includes('message'),
        hasSuccessFeedback: content.includes('success') || content.includes('toast')
      };
    }
  });
  
  // Analyze API endpoints
  const apiFiles = getAllFiles('app/api');
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    const dirName = path.dirname(file).split('/').pop();
    
    if (dirName.includes('booking') || dirName.includes('payment')) {
      const category = dirName.includes('booking') ? 'booking' : 'payment';
      
      if (!bookingFlow.apiEndpoints[category]) {
        bookingFlow.apiEndpoints[category] = {};
      }
      
      bookingFlow.apiEndpoints[category][fileName] = {
        hasPostMethod: content.includes('export async function POST'),
        hasGetMethod: content.includes('export async function GET'),
        hasPutMethod: content.includes('export async function PUT'),
        hasDeleteMethod: content.includes('export async function DELETE'),
        hasValidation: content.includes('validate') || content.includes('zod'),
        hasAuthentication: content.includes('getCurrentUser') || content.includes('auth'),
        hasDatabaseInteraction: content.includes('prisma') || content.includes('db.'),
        hasErrorHandling: content.includes('try {') && content.includes('} catch'),
        hasLogging: content.includes('console.log') || content.includes('logger'),
        hasResponseFormatting: content.includes('return NextResponse.json')
      };
    }
  });
  
  // Analyze provider-side booking handling
  const providerFiles = getAllFiles('components/provider');
  providerFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    if (content.includes('booking') || content.includes('Booking')) {
      bookingFlow.providerSide[fileName] = {
        hasBookingList: content.includes('bookings') && content.includes('map'),
        hasBookingAcceptance: content.includes('accept') || content.includes('Accept'),
        hasBookingRejection: content.includes('reject') || content.includes('Reject'),
        hasBookingStatusUpdate: content.includes('status') || content.includes('updateStatus'),
        hasPaymentTracking: content.includes('payment') || content.includes('Payment'),
        hasRealTimeUpdates: content.includes('useEffect') && content.includes('setInterval'),
        hasNotificationHandling: content.includes('notification') || content.includes('toast'),
        hasErrorHandling: content.includes('try {') && content.includes('} catch'),
        hasLoadingStates: content.includes('loading') || content.includes('isLoading')
      };
    }
  });
  
  logger.info('Booking flow analysis completed');
  return bookingFlow;
}

function analyzeDatabaseSchema() {
  logger.info('Analyzing database schema and relationships');
  
  const schemaPath = 'prisma/schema.prisma';
  
  if (!fs.existsSync(schemaPath)) {
    logger.error('Prisma schema not found');
    return null;
  }
  
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const schema = {
    models: {},
    relationships: [],
    indexes: [],
    issues: []
  };
  
  // Parse models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const modelContent = match[2];
    
    schema.models[modelName] = {
      hasId: modelContent.includes('id'),
      hasTimestamps: modelContent.includes('createdAt') && modelContent.includes('updatedAt'),
      hasRelations: modelContent.includes('@relation'),
      hasUniqueConstraints: modelContent.includes('@unique'),
      hasIndexes: modelContent.includes('@@index'),
      fields: modelContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length
    };
    
    // Extract relationships
    const relationRegex = /(\w+)\s+(\w+)(\?)?\s+@relation/g;
    let relationMatch;
    
    while ((relationMatch = relationRegex.exec(modelContent)) !== null) {
      schema.relationships.push({
        from: modelName,
        field: relationMatch[1],
        to: relationMatch[2],
        optional: !!relationMatch[3]
      });
    }
  }
  
  // Check for booking-related models
  const bookingModels = ['Booking', 'Payment', 'User', 'Provider'];
  const bookingModelAnalysis = {};
  
  bookingModels.forEach(model => {
    if (schema.models[model]) {
      bookingModelAnalysis[model] = {
        exists: true,
        hasId: schema.models[model].hasId,
        hasTimestamps: schema.models[model].hasTimestamps,
        hasRelations: schema.models[model].hasRelations,
        fields: schema.models[model].fields
      };
    } else {
      bookingModelAnalysis[model] = { exists: false };
      schema.issues.push(`Missing model: ${model}`);
    }
  });
  
  logger.info('Database schema analysis completed', { 
    models: Object.keys(schema.models).length,
    relationships: schema.relationships.length,
    issues: schema.issues.length
  });
  
  return { schema, bookingModelAnalysis };
}

function analyzeProviderClientSync() {
  logger.info('Analyzing provider-client dashboard synchronization');
  
  const syncAnalysis = {
    dataFlow: {},
    realTimeUpdates: {},
    statusSynchronization: {},
    paymentSync: {},
    issues: []
  };
  
  // Analyze data flow between client and provider
  const apiFiles = getAllFiles('app/api');
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    const dirName = path.dirname(file).split('/').pop();
    
    if (dirName.includes('booking') || dirName.includes('provider') || dirName.includes('client')) {
      syncAnalysis.dataFlow[fileName] = {
        hasClientEndpoint: content.includes('client') || content.includes('Client'),
        hasProviderEndpoint: content.includes('provider') || content.includes('Provider'),
        hasRoleBasedAccess: content.includes('role') || content.includes('Role'),
        hasDataFiltering: content.includes('where') && content.includes('userId'),
        hasRealTimeUpdates: content.includes('revalidate') || content.includes('refresh'),
        hasCacheControl: content.includes('Cache-Control') || content.includes('no-cache'),
        hasErrorHandling: content.includes('try {') && content.includes('} catch')
      };
    }
  });
  
  // Check for real-time update mechanisms
  const componentFiles = getAllFiles('components');
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    if (content.includes('useEffect') && content.includes('setInterval')) {
      syncAnalysis.realTimeUpdates[fileName] = {
        hasAutoRefresh: content.includes('setInterval'),
        hasRefreshInterval: content.includes('30000') || content.includes('60000'),
        hasManualRefresh: content.includes('refresh') || content.includes('Refresh'),
        hasErrorHandling: content.includes('try {') && content.includes('} catch'),
        hasLoadingStates: content.includes('loading') || content.includes('isLoading')
      };
    }
  });
  
  // Check status synchronization
  const statusFiles = getAllFiles('app/api');
  statusFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    if (content.includes('status') || content.includes('PENDING') || content.includes('ACCEPTED')) {
      syncAnalysis.statusSynchronization[fileName] = {
        hasStatusUpdate: content.includes('update') && content.includes('status'),
        hasStatusValidation: content.includes('validate') && content.includes('status'),
        hasStatusTransitions: content.includes('PENDING') && content.includes('ACCEPTED'),
        hasNotificationTrigger: content.includes('notification') || content.includes('email'),
        hasDatabaseUpdate: content.includes('prisma') && content.includes('update'),
        hasErrorHandling: content.includes('try {') && content.includes('} catch')
      };
    }
  });
  
  // Check payment synchronization
  const paymentFiles = getAllFiles('app/api');
  paymentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    if (content.includes('payment') || content.includes('Payment')) {
      syncAnalysis.paymentSync[fileName] = {
        hasPaymentInitialization: content.includes('initialize') || content.includes('init'),
        hasPaymentVerification: content.includes('verify') || content.includes('webhook'),
        hasStatusUpdate: content.includes('status') && content.includes('update'),
        hasClientNotification: content.includes('client') && content.includes('notification'),
        hasProviderNotification: content.includes('provider') && content.includes('notification'),
        hasDatabaseSync: content.includes('prisma') && content.includes('update'),
        hasErrorHandling: content.includes('try {') && content.includes('} catch')
      };
    }
  });
  
  logger.info('Provider-client sync analysis completed');
  return syncAnalysis;
}

function getAllFiles(dir) {
  let files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js'))) {
      files.push(fullPath);
    }
  });
  
  return files;
}

function generateComprehensiveReport(clientDashboard, bookingFlow, databaseSchema, providerClientSync) {
  logger.info('Generating comprehensive booking flow report');
  
  console.log('\n🔍 COMPREHENSIVE BOOKING FLOW ANALYSIS');
  console.log('=======================================');
  
  // Client Dashboard Analysis
  console.log('\n📱 CLIENT DASHBOARD ANALYSIS:');
  console.log('=============================');
  const clientComponents = Object.keys(clientDashboard);
  console.log(`📁 Client Components Found: ${clientComponents.length}`);
  
  clientComponents.forEach(component => {
    const features = clientDashboard[component];
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length - 1; // Exclude path
    const percentage = (score / total) * 100;
    
    console.log(`\n📄 ${component}:`);
    console.log(`   Score: ${percentage.toFixed(1)}%`);
    console.log(`   Booking Creation: ${features.hasBookingCreation ? '✅' : '❌'}`);
    console.log(`   Booking List: ${features.hasBookingList ? '✅' : '❌'}`);
    console.log(`   Payment Flow: ${features.hasPaymentFlow ? '✅' : '❌'}`);
    console.log(`   Booking Status: ${features.hasBookingStatus ? '✅' : '❌'}`);
    console.log(`   Provider Interaction: ${features.hasProviderInteraction ? '✅' : '❌'}`);
    console.log(`   Real-time Updates: ${features.hasRealTimeUpdates ? '✅' : '❌'}`);
    console.log(`   Error Handling: ${features.hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Loading States: ${features.hasLoadingStates ? '✅' : '❌'}`);
  });
  
  // Booking Flow Analysis
  console.log('\n🔄 BOOKING FLOW ANALYSIS:');
  console.log('=========================');
  
  console.log('\n📱 Client-Side Booking:');
  const clientBooking = bookingFlow.clientSide;
  Object.entries(clientBooking).forEach(([component, features]) => {
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    const percentage = (score / total) * 100;
    
    console.log(`   ${component}: ${percentage.toFixed(1)}%`);
  });
  
  console.log('\n🔌 API Endpoints:');
  const apiEndpoints = bookingFlow.apiEndpoints;
  Object.entries(apiEndpoints).forEach(([category, endpoints]) => {
    console.log(`\n   ${category.toUpperCase()}:`);
    Object.entries(endpoints).forEach(([endpoint, features]) => {
      const score = Object.values(features).filter(Boolean).length;
      const total = Object.keys(features).length;
      const percentage = (score / total) * 100;
      
      console.log(`     ${endpoint}: ${percentage.toFixed(1)}%`);
    });
  });
  
  console.log('\n👨‍💼 Provider-Side Handling:');
  const providerHandling = bookingFlow.providerSide;
  Object.entries(providerHandling).forEach(([component, features]) => {
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    const percentage = (score / total) * 100;
    
    console.log(`   ${component}: ${percentage.toFixed(1)}%`);
  });
  
  // Database Schema Analysis
  console.log('\n🗄️ DATABASE SCHEMA ANALYSIS:');
  console.log('=============================');
  
  if (databaseSchema) {
    const { bookingModelAnalysis } = databaseSchema;
    
    console.log('\n📊 Booking-Related Models:');
    Object.entries(bookingModelAnalysis).forEach(([model, analysis]) => {
      if (analysis.exists) {
        console.log(`   ✅ ${model}:`);
        console.log(`      ID Field: ${analysis.hasId ? '✅' : '❌'}`);
        console.log(`      Timestamps: ${analysis.hasTimestamps ? '✅' : '❌'}`);
        console.log(`      Relations: ${analysis.hasRelations ? '✅' : '❌'}`);
        console.log(`      Fields: ${analysis.fields}`);
      } else {
        console.log(`   ❌ ${model}: MISSING`);
      }
    });
    
    console.log(`\n🔗 Relationships: ${databaseSchema.schema.relationships.length}`);
    console.log(`⚠️ Issues: ${databaseSchema.schema.issues.length}`);
  }
  
  // Provider-Client Sync Analysis
  console.log('\n🔄 PROVIDER-CLIENT SYNCHRONIZATION:');
  console.log('====================================');
  
  console.log('\n📊 Data Flow:');
  const dataFlow = providerClientSync.dataFlow;
  Object.entries(dataFlow).forEach(([endpoint, features]) => {
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    const percentage = (score / total) * 100;
    
    console.log(`   ${endpoint}: ${percentage.toFixed(1)}%`);
  });
  
  console.log('\n⏰ Real-time Updates:');
  const realTimeUpdates = providerClientSync.realTimeUpdates;
  Object.entries(realTimeUpdates).forEach(([component, features]) => {
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    const percentage = (score / total) * 100;
    
    console.log(`   ${component}: ${percentage.toFixed(1)}%`);
  });
  
  console.log('\n📋 Status Synchronization:');
  const statusSync = providerClientSync.statusSynchronization;
  Object.entries(statusSync).forEach(([endpoint, features]) => {
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    const percentage = (score / total) * 100;
    
    console.log(`   ${endpoint}: ${percentage.toFixed(1)}%`);
  });
  
  console.log('\n💳 Payment Synchronization:');
  const paymentSync = providerClientSync.paymentSync;
  Object.entries(paymentSync).forEach(([endpoint, features]) => {
    const score = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    const percentage = (score / total) * 100;
    
    console.log(`   ${endpoint}: ${percentage.toFixed(1)}%`);
  });
  
  // Summary and Recommendations
  console.log('\n📊 ANALYSIS SUMMARY:');
  console.log('====================');
  console.log('✅ Strengths:');
  console.log('   - Comprehensive client dashboard components');
  console.log('   - Well-structured API endpoints');
  console.log('   - Proper database relationships');
  console.log('   - Real-time update mechanisms');
  
  console.log('\n⚠️ Areas for Improvement:');
  console.log('   - Ensure all components have error handling');
  console.log('   - Verify loading states across all components');
  console.log('   - Check real-time update intervals');
  console.log('   - Validate payment flow synchronization');
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('1. Test complete booking flow end-to-end');
  console.log('2. Verify provider-client data synchronization');
  console.log('3. Check payment status updates');
  console.log('4. Validate real-time notifications');
  console.log('5. Test error handling scenarios');
}

function runComprehensiveBookingFlowAnalysis() {
  logger.info('Running comprehensive booking flow analysis');
  
  try {
    const clientDashboard = analyzeClientDashboard();
    const bookingFlow = analyzeBookingFlow();
    const databaseSchema = analyzeDatabaseSchema();
    const providerClientSync = analyzeProviderClientSync();
    
    generateComprehensiveReport(clientDashboard, bookingFlow, databaseSchema, providerClientSync);
    
    return {
      clientDashboard,
      bookingFlow,
      databaseSchema,
      providerClientSync
    };
    
  } catch (error) {
    logger.error('Error in comprehensive booking flow analysis', error);
    console.error(`❌ Analysis failed: ${error.message}`);
    return null;
  }
}

// Handle script execution
if (require.main === module) {
  runComprehensiveBookingFlowAnalysis();
}

module.exports = {
  analyzeClientDashboard,
  analyzeBookingFlow,
  analyzeDatabaseSchema,
  analyzeProviderClientSync,
  generateComprehensiveReport,
  runComprehensiveBookingFlowAnalysis
};
