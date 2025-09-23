import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DATABASE FIX API ===');
    
    // Check if payoutStatus column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'payoutStatus'
    `;
    
    if (Array.isArray(result) && result.length === 0) {
      console.log('payoutStatus column missing, adding it...');
      
      // Add the missing column
      await prisma.$executeRaw`
        ALTER TABLE "bookings" ADD COLUMN "payoutStatus" TEXT;
      `;
      
      console.log('payoutStatus column added successfully');
      
      return NextResponse.json({
        success: true,
        message: 'payoutStatus column added to bookings table',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('payoutStatus column already exists');
      
      return NextResponse.json({
        success: true,
        message: 'payoutStatus column already exists',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Database fix error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE STATUS CHECK ===');
    
    // Check if payoutStatus column exists
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'payoutStatus'
    `;
    
    const hasColumn = Array.isArray(result) && result.length > 0;
    
    return NextResponse.json({
      success: true,
      message: 'Database status check completed',
      timestamp: new Date().toISOString(),
      database: {
        hasPayoutStatusColumn: hasColumn,
        columnInfo: hasColumn ? result[0] : null
      }
    });
    
  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
