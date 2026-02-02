import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'Only admins can view pending payouts'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    console.log(`📥 Admin ${admin.id} fetching payouts with status: ${status}`);

    // Ensure Prisma connection
    try {
      await prisma.$connect();
    } catch (connectError) {
      console.warn('⚠️ Prisma connection check:', connectError);
    }

    // First, check total payout count for debugging
    const totalCount = await prisma.payout.count();
    console.log(`📊 Total payouts in database: ${totalCount}`);

    const statusCount = await prisma.payout.count({
      where: {
        status: status as any,
      }
    });
    console.log(`📊 Payouts with status "${status}": ${statusCount}`);

    const payouts = await prisma.payout.findMany({
      where: {
        status: status as any,
      },
      include: {
        provider: {
          include: { user: true }
        },
        payment: {
          include: {
            booking: {
              include: { 
                service: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }, // Changed to desc to show newest first
      take: 100
    });

    console.log(`✅ Found ${payouts.length} payouts with status "${status}"`);

    if (payouts.length === 0) {
      console.log('ℹ️ No payouts found. Checking all payout statuses...');
      const allStatuses = await prisma.payout.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });
      console.log('📊 Payout status distribution:', allStatuses);
    }

    return NextResponse.json({
      success: true,
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        provider: {
          id: p.provider.id,
          name: p.provider.businessName || p.provider.user.name,
          email: p.provider.user.email,
          bankName: p.provider.bankName,
          bankCode: p.provider.bankCode,
          accountNumber: p.provider.accountNumber ? p.provider.accountNumber.substring(0, 4) + '****' : null, // Partially masked
          accountName: p.provider.accountName
        },
        payment: {
          id: p.payment.id,
          paystackRef: p.payment.paystackRef,
          amount: p.payment.amount,
          escrowAmount: p.payment.escrowAmount,
          platformFee: p.payment.platformFee,
          paidAt: p.payment.paidAt
        },
        booking: {
          id: p.payment.booking.id,
          serviceName: p.payment.booking.service?.name,
          totalAmount: p.payment.booking.totalAmount,
          scheduledDate: p.payment.booking.scheduledDate,
          client: {
            name: p.payment.booking.client.name,
            email: p.payment.booking.client.email
          }
        }
      })),
      count: payouts.length
    });

  } catch (error) {
    console.error('❌ Error fetching pending payouts:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch pending payouts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
