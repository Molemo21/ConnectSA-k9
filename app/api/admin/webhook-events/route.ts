import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    
    // Only admins can view webhook events
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType');
    const processed = searchParams.get('processed');
    const reference = searchParams.get('reference');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    
    if (eventType) {
      where.eventType = eventType;
    }
    
    if (processed !== null) {
      where.processed = processed === 'true';
    }
    
    if (reference) {
      where.paystackRef = { contains: reference, mode: 'insensitive' };
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const totalCount = await prisma.webhookEvent.count({ where });
    
    // Get webhook events with pagination
    const webhookEvents = await prisma.webhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get summary statistics
    const stats = await prisma.$transaction([
      prisma.webhookEvent.count({ where: { processed: true } }),
      prisma.webhookEvent.count({ where: { processed: false } }),
      prisma.webhookEvent.count({ where: { error: { not: null } } }),
      prisma.webhookEvent.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
        where
      })
    ]);

    const [processedCount, unprocessedCount, errorCount, eventTypeBreakdown] = stats;

    const response = {
      success: true,
      data: {
        webhookEvents,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        statistics: {
          total: totalCount,
          processed: processedCount,
          unprocessed: unprocessedCount,
          errors: errorCount,
          eventTypeBreakdown: eventTypeBreakdown.map(item => ({
            eventType: item.eventType,
            count: item._count.eventType
          }))
        }
      },
      message: "Webhook events retrieved successfully"
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error retrieving webhook events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Retry failed webhook events
export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, webhookEventId } = body;

    if (action === 'retry' && webhookEventId) {
      // Retry a specific failed webhook event
      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { id: webhookEventId }
      });

      if (!webhookEvent) {
        return NextResponse.json({ error: "Webhook event not found" }, { status: 404 });
      }

      if (webhookEvent.processed) {
        return NextResponse.json({ error: "Webhook event already processed" }, { status: 400 });
      }

      // Reset the webhook event for retry
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          processed: false,
          error: null,
          processedAt: null,
          retryCount: { increment: 1 }
        }
      });

      return NextResponse.json({
        success: true,
        message: "Webhook event reset for retry",
        webhookEventId
      });

    } else if (action === 'retry-all-failed') {
      // Retry all failed webhook events
      const failedEvents = await prisma.webhookEvent.findMany({
        where: {
          OR: [
            { processed: false },
            { error: { not: null } }
          ]
        }
      });

      if (failedEvents.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No failed webhook events to retry"
        });
      }

      // Reset all failed events
      await prisma.webhookEvent.updateMany({
        where: {
          OR: [
            { processed: false },
            { error: { not: null } }
          ]
        },
        data: {
          processed: false,
          error: null,
          processedAt: null,
          retryCount: { increment: 1 }
        }
      });

      return NextResponse.json({
        success: true,
        message: `${failedEvents.length} failed webhook events reset for retry`,
        count: failedEvents.length
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("❌ Error processing webhook event action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
