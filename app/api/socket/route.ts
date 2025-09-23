/**
 * Socket.IO API Route
 * 
 * Handles WebSocket connections and real-time event broadcasting
 */

import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { socketManager } from '@/lib/socket-server';
import { logSystem } from '@/lib/logger';

// Global Socket.IO server instance
let io: SocketIOServer | null = null;

export async function GET(request: NextRequest) {
  try {
    logSystem.success('socket_api', 'Socket.IO API route accessed');

    // Initialize Socket.IO server if not already done
    if (!io) {
      io = new SocketIOServer({
        cors: {
          origin: process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : "http://localhost:3000",
          methods: ["GET", "POST"]
        },
        path: '/api/socket'
      });

      // Configure the socket manager
      socketManager.setServer(io);

      logSystem.success('socket_api', 'Socket.IO server initialized', {
        metadata: {
          corsOrigin: process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : "http://localhost:3000"
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Socket.IO server is running',
      connectedUsers: socketManager.getConnectedUsers().length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    logSystem.error('socket_api', 'Socket.IO API route error', error as Error, {
      error_code: 'SOCKET_API_ERROR'
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Socket.IO server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    logSystem.success('socket_api', 'Socket.IO broadcast request received', {
      action,
      metadata: data
    });

    if (!io) {
      throw new Error('Socket.IO server not initialized');
    }

    // Handle different broadcast actions
    switch (action) {
      case 'booking_created':
        socketManager.broadcastBookingEvent({
          type: 'booking',
          action: 'created',
          data: data,
          targetUsers: data.targetUsers
        });
        break;

      case 'booking_accepted':
        socketManager.broadcastBookingEvent({
          type: 'booking',
          action: 'accepted',
          data: data,
          targetUsers: data.targetUsers
        });
        break;

      case 'booking_rejected':
        socketManager.broadcastBookingEvent({
          type: 'booking',
          action: 'rejected',
          data: data,
          targetUsers: data.targetUsers
        });
        break;

      case 'payment_status_changed':
        socketManager.broadcastPaymentEvent({
          type: 'payment',
          action: 'status_changed',
          data: data,
          targetUsers: data.targetUsers
        });
        break;

      case 'payout_status_changed':
        socketManager.broadcastPayoutEvent({
          type: 'payout',
          action: 'status_changed',
          data: data,
          targetUsers: data.targetUsers
        });
        break;

      case 'notification':
        socketManager.broadcastNotification({
          type: 'notification',
          action: 'new',
          data: data,
          targetUsers: data.targetUsers
        });
        break;

      default:
        throw new Error(`Unknown broadcast action: ${action}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Broadcasted ${action} event`,
      connectedUsers: socketManager.getConnectedUsers().length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    logSystem.error('socket_api', 'Socket.IO broadcast error', error as Error, {
      error_code: 'SOCKET_BROADCAST_ERROR'
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Broadcast failed' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Export the Socket.IO server instance for use in other parts of the application
export { io };
