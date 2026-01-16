import { NextResponse } from "next/server";
import { db } from "@/lib/db-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Debug endpoint to diagnose services API issues
 * GET /api/services/debug
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // Check 1: Environment variables
    diagnostics.checks.env = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    };

    // Check 2: Database client initialization
    diagnostics.checks.dbClient = {
      dbExists: !!db,
      prismaExists: !!prisma,
      dbServiceExists: !!(db && db.service)
    };

    // Check 3: Database connection
    try {
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        diagnostics.checks.connection = { status: 'connected' };
      } else {
        diagnostics.checks.connection = { status: 'prisma_not_available' };
      }
    } catch (error) {
      diagnostics.checks.connection = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Check 4: Tables existence
    try {
      if (prisma) {
        const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `;
        
        const tableNames = tables.map(t => t.table_name);
        diagnostics.checks.tables = {
          serviceExists: tableNames.includes('services'),
          serviceCategoryExists: tableNames.includes('service_categories'),
          allTables: tableNames
        };
      }
    } catch (error) {
      diagnostics.checks.tables = {
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Check 5: Try actual query
    try {
      if (db && db.service) {
        const count = await db.service.count();
        diagnostics.checks.query = {
          status: 'success',
          serviceCount: count
        };
      } else {
        diagnostics.checks.query = {
          status: 'db_not_available'
        };
      }
    } catch (error) {
      diagnostics.checks.query = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    diagnostics.status = 'success';
    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
