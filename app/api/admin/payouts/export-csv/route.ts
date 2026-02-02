import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logPayment } from "@/lib/logger";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'Only admins can export payout CSVs'
      }, { status: 401 });
    }

    // Get pending approved payouts
    const payouts = await prisma.payout.findMany({
      where: {
        status: 'APPROVED',
        method: 'MANUAL'
      },
      include: {
        provider: {
          include: { user: true }
        },
        payment: {
          include: { 
            booking: { 
              include: { service: true } 
            } 
          }
        }
      },
      orderBy: { requestedAt: 'asc' }
    });

    if (payouts.length === 0) {
      return NextResponse.json({
        error: 'No approved payouts to export',
        details: 'There are no approved manual payouts ready for export'
      }, { status: 400 });
    }

    // Create payout batch
    const batchNumber = `BATCH_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(Date.now()).slice(-3)}`;
    
    const batch = await prisma.payoutBatch.create({
      data: {
        batchNumber,
        status: 'PENDING',
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        payoutCount: payouts.length
      }
    });

    // Generate CSV
    const csvRows = [
      // Header
      ['Account Name', 'Account Number', 'Bank Code', 'Amount', 'Reference', 'Description'].join(',')
    ];

    for (const payout of payouts) {
      csvRows.push([
        payout.accountName,
        payout.accountNumber,
        payout.bankCode,
        payout.amount.toFixed(2),
        `PAYOUT_${payout.id}`,
        `Payment for ${payout.payment.booking.service?.name || 'Service'} - Booking ${payout.payment.bookingId}`
      ].join(','));
      
      // Link payout to batch
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          csvBatchId: batch.id,
          status: 'PROCESSING'
        }
      });
    }

    // Generate CSV content
    const csvContent = csvRows.join('\n');
    
    // In production, upload to S3/storage and get URL
    // For now, return CSV as base64 or direct content
    const csvBase64 = Buffer.from(csvContent).toString('base64');

    // Update batch
    await prisma.payoutBatch.update({
      where: { id: batch.id },
      data: {
        status: 'EXPORTED',
        exportedAt: new Date(),
        // In production: csvUrl: s3Url
      }
    });

    logPayment.success('admin', 'Payout CSV exported', {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      payoutCount: payouts.length,
      totalAmount: batch.totalAmount,
      exportedBy: admin.id
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        payoutCount: payouts.length,
        totalAmount: batch.totalAmount
      },
      csv: csvBase64, // In production, return URL instead
      csvContent: csvContent // For immediate download
    });

  } catch (error) {
    console.error('❌ Error exporting payout CSV:', error);
    
    return NextResponse.json({
      error: 'Failed to export payout CSV',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
