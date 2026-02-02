import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'Only admins can view payout receipts'
      }, { status: 401 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: {
        provider: {
          include: { 
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
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
      }
    });

    if (!payout) {
      return NextResponse.json({ 
        error: 'Payout not found' 
      }, { status: 404 });
    }

    // Calculate amounts
    const totalPayment = payout.payment.amount;
    const platformFee = payout.payment.platformFee || 0;
    const providerAmount = payout.amount; // This is escrowAmount

    return NextResponse.json({
      success: true,
      receipt: {
        payoutId: payout.id,
        status: payout.status,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
        provider: {
          id: payout.provider.id,
          businessName: payout.provider.businessName,
          contactName: payout.provider.user.name,
          email: payout.provider.user.email,
          bankDetails: {
            bankName: payout.provider.bankName,
            bankCode: payout.provider.bankCode,
            accountNumber: payout.provider.accountNumber,
            accountName: payout.provider.accountName
          }
        },
        booking: {
          id: payout.payment.booking.id,
          serviceName: payout.payment.booking.service?.name,
          scheduledDate: payout.payment.booking.scheduledDate,
          address: payout.payment.booking.address,
          client: {
            name: payout.payment.booking.client.name,
            email: payout.payment.booking.client.email
          }
        },
        payment: {
          id: payout.payment.id,
          paystackRef: payout.payment.paystackRef,
          paidAt: payout.payment.paidAt,
          currency: payout.payment.currency || 'ZAR'
        },
        amounts: {
          totalPayment: totalPayment,
          platformFee: platformFee,
          providerAmount: providerAmount,
          breakdown: {
            total: `R${totalPayment.toFixed(2)}`,
            platformFee: `R${platformFee.toFixed(2)}`,
            providerAmount: `R${providerAmount.toFixed(2)}`
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payout receipt:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch payout receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
