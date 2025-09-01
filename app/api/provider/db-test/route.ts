import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      status: "deploying",
      message: "Service is being deployed, please try again in a few minutes"
    }, { status: 503 });
  }

  try {
    // Test database connection
    const providerCount = await prisma.provider.count();
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection working", 
      providerCount,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed", 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}
