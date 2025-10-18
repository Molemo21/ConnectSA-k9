import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  const healthChecks = {
    database: { status: 'unknown', responseTime: 0, error: null },
    email: { status: 'unknown', configured: false },
    payments: { status: 'unknown', configured: false },
    environment: { status: 'unknown', nodeEnv: process.env.NODE_ENV }
  };

  try {
    // Database health check
    const dbStartTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
        error: null
      };
    } catch (error) {
      healthChecks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        error: error.message
      };
    }

    // Email service check
    healthChecks.email = {
      status: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
      configured: !!process.env.RESEND_API_KEY
    };

    // Payment service check
    healthChecks.payments = {
      status: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'not_configured',
      configured: !!process.env.PAYSTACK_SECRET_KEY,
      testMode: process.env.PAYSTACK_TEST_MODE === 'true',
      mode: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
    };

    // Environment check
    healthChecks.environment = {
      status: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    };

    // Overall health status
    const isHealthy = 
      healthChecks.database.status === 'healthy' &&
      healthChecks.email.configured &&
      healthChecks.payments.configured;

    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      checks: healthChecks
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error.message,
      checks: healthChecks
    }, { status: 503 });
  }
}