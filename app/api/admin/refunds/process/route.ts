import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { RefundService } from "@/lib/refund";
import { z } from "zod";

export const dynamic = 'force-dynamic'

const refundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive(),
  reason: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'Only admins can process refunds'
      }, { status: 401 });
    }

    const body = await request.json();
    const validated = refundSchema.parse(body);

    const refund = await RefundService.processRefund({
      paymentId: validated.paymentId,
      amount: validated.amount,
      reason: validated.reason,
      initiatedBy: admin.id,
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        processedAt: refund.processedAt
      }
    });

  } catch (error) {
    console.error('❌ Error processing refund:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to process refund',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
