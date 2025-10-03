/**
 * Socket.IO API Route
 * 
 * Simple API route for Socket.IO status and configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSocketServer, broadcastBookingUpdate, broadcastPaymentUpdate, broadcastPayoutUpdate, broadcastNotification } from '@/lib/socket-server';

export async function GET(request: NextRequest) {
  try {
    // Get server status and connected users
    const io = getSocketServer();
    
    if (!io) {
      return NextResponse.json({
        success: false,
        status: 'inactive',
        message: 'Socket.IO server not initialized'
      });
    }

    const connectedUsers = io.sockets.sockets.size;
    
    logger.info('socket_status', 'Socket server status requested', {
      connectedUsers,
      serverActive: true
    });

    return NextResponse.json({
      success: true,
      status: 'active',
      connectedUsers,
      message: 'Socket.IO server is running'
    });

  } catch (error) {
    logger.error('socket_status', 'Socket status error', error as Error, {
      error_code: 'SOCKET_STATUS_ERROR'
    });

    return NextResponse.json({ 
      success: false, 
      status: 'error',
      error: 'Socket.IO server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, targetUsers } = body;

    logger.info('socket_broadcast', 'Broadcasting event', {
      event,
      targetUsers,
      metadata: { dataKeys: Object.keys(data || {}) }
    });

    // Broadcast the event using the appropriate function
    switch (event.type) {
      case 'booking':
        broadcastBookingUpdate(data.id || data.bookingId, event.action, data, targetUsers);
        break;
      case 'payment':
        broadcastPaymentUpdate(data.id || data.paymentId, event.action, data, targetUsers);
        break;
      case 'payout':
        broadcastPayoutUpdate(data.id || data.payoutId, event.action, data, targetUsers);
        break;
      case 'notification':
        broadcastNotification(targetUsers || [], event.action, data.title, data.message);
        break;
      default:
        logger.warn('socket_broadcast', 'Unknown event type', {
          eventType: event.type,
          event
        });
    }

    logger.success('socket_broadcast', 'Event broadcasted successfully', {
      event: event.type,
      action: event.action,
      targetUsers: targetUsers?.length || 'all'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Event broadcasted successfully' 
    });

  } catch (error) {
    logger.error('socket_broadcast', 'Broadcast error', error as Error, {
      error_code: 'BROADCAST_ERROR'
    });

    return NextResponse.json({ 
      success: false, 
      error: 'Broadcast failed' 
    }, { status: 500 });
  }
}