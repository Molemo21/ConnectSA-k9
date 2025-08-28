import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Starting to fetch providers...');
    
    // Test basic connection first
    const providerCount = await prisma.provider.count();
    console.log('🔍 Total providers count:', providerCount);
    
    // Test a simple query without include
    const simpleProviders = await prisma.provider.findMany({
      select: { id: true, status: true }
    });
    console.log('🔍 Simple providers query result:', simpleProviders.length, 'providers');
    
    // Now try the full query with include
    console.log('🔍 Attempting full query with user include...');
    const providers = await prisma.provider.findMany({
      include: {
        user: true,
      },
    });
    
    console.log('🔍 Successfully fetched providers with users:', providers.length);
    return NextResponse.json(providers);
  } catch (error) {
    console.error('❌ Error fetching providers:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
} 