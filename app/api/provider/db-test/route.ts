import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
