#!/usr/bin/env node

/**
 * Diagnostic script to analyze bookings visibility issues
 */

const { PrismaClient } = require('@prisma/client');

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

const logger = createLogger('BookingsDiagnostic');

async function analyzeBookings() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Starting bookings analysis');

    // Check total bookings
    const totalBookings = await prisma.booking.count();
    logger.info('Total bookings in database', { count: totalBookings });
    
    // Check bookings by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    logger.info('Bookings by status', { 
      statusCounts: bookingsByStatus.map(g => ({ status: g.status, count: g._count.status }))
    });
    
    // Check recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, email: true, name: true } },
        provider: { select: { id: true, businessName: true } },
        service: { select: { id: true, name: true } }
      }
    });
    
    logger.info('Recent bookings sample', {
      bookings: recentBookings.map(b => ({
        id: b.id,
        status: b.status,
        clientEmail: b.client.email,
        providerName: b.provider?.businessName,
        serviceName: b.service?.name,
        createdAt: b.createdAt
      }))
    });

    // Check users and their roles
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      take: 10
    });
    
    logger.info('Sample users', {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role
      }))
    });

    // Check providers
    const providers = await prisma.provider.findMany({
      take: 5,
      include: {
        user: { select: { id: true, email: true, name: true } }
      }
    });
    
    logger.info('Sample providers', {
      providers: providers.map(p => ({
        id: p.id,
        businessName: p.businessName,
        status: p.status,
        userEmail: p.user.email
      }))
    });

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error analyzing bookings', error);
    await prisma.$disconnect();
  }
}

async function testBookingQueries() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing booking queries');

    // Get a sample client
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });
    
    if (client) {
      logger.info('Testing client bookings query', { clientId: client.id, clientEmail: client.email });
      
      const clientBookings = await prisma.booking.findMany({
        where: { clientId: client.id },
        include: {
          service: true,
          provider: { include: { user: true } },
          payment: true,
          review: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      logger.info('Client bookings found', {
        clientId: client.id,
        bookingCount: clientBookings.length,
        bookings: clientBookings.map(b => ({
          id: b.id,
          status: b.status,
          serviceName: b.service?.name,
          providerName: b.provider?.businessName,
          hasPayment: !!b.payment,
          hasReview: !!b.review
        }))
      });
    }

    // Get a sample provider
    const provider = await prisma.provider.findFirst({
      include: { user: true }
    });
    
    if (provider) {
      logger.info('Testing provider bookings query', { providerId: provider.id, userEmail: provider.user.email });
      
      const providerBookings = await prisma.booking.findMany({
        where: { providerId: provider.id },
        include: {
          service: true,
          client: true,
          payment: true,
          review: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      logger.info('Provider bookings found', {
        providerId: provider.id,
        bookingCount: providerBookings.length,
        bookings: providerBookings.map(b => ({
          id: b.id,
          status: b.status,
          serviceName: b.service?.name,
          clientEmail: b.client.email,
          hasPayment: !!b.payment,
          hasReview: !!b.review
        }))
      });
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing booking queries', error);
    await prisma.$disconnect();
  }
}

async function checkAPIEndpoints() {
  logger.info('Checking API endpoint files');
  
  const fs = require('fs');
  const path = require('path');
  
  // Check client dashboard API
  const clientDashboardFiles = [
    'app/api/bookings/route.ts',
    'app/api/bookings/sync/route.ts',
    'app/api/user/bookings/route.ts'
  ];
  
  clientDashboardFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logger.info('Client bookings API exists', { file });
    } else {
      logger.warn('Client bookings API missing', { file });
    }
  });
  
  // Check provider dashboard API
  const providerDashboardFiles = [
    'app/api/provider/bookings/route.ts',
    'app/api/provider/dashboard/route.ts'
  ];
  
  providerDashboardFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logger.info('Provider bookings API exists', { file });
    } else {
      logger.warn('Provider bookings API missing', { file });
    }
  });
}

async function runDiagnostic() {
  console.log('🔍 BOOKINGS VISIBILITY DIAGNOSTIC');
  console.log('=====================================');
  
  await analyzeBookings();
  console.log('\n');
  await testBookingQueries();
  console.log('\n');
  await checkAPIEndpoints();
  
  console.log('\n✅ Diagnostic complete');
}

// Handle script execution
if (require.main === module) {
  runDiagnostic().catch((error) => {
    logger.error('Diagnostic execution failed', error);
    console.error('Diagnostic failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  analyzeBookings,
  testBookingQueries,
  checkAPIEndpoints,
  runDiagnostic
};
