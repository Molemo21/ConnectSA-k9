/**
 * Socket.IO Server Setup for Real-time Updates
 * 
 * Handles WebSocket connections and event broadcasting for:
 * - Booking creation, acceptance, rejection
 * - Payment status changes (PAID, ESCROW, RELEASED)
 * - Provider payout status changes (PROCESSING, COMPLETED, FAILED)
 */

import { Server as SocketIOServer } from 'socket.io';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logSystem } from '@/lib/logger';

export interface SocketUser {
  userId: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  socketId: string;
  connectedAt: Date;
}

export interface SocketEvent {
  type: 'booking' | 'payment' | 'payout' | 'notification';
  action: string;
  data: any;
  targetUsers?: string[]; // Specific user IDs to notify
  broadcastToRole?: 'CLIENT' | 'PROVIDER' | 'ADMIN'; // Broadcast to specific role
}

class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor() {
    this.initializeServer();
  }

  private initializeServer() {
    if (typeof window !== 'undefined') {
      // Client-side, don't initialize server
      return;
    }

    try {
      // This will be properly initialized in the API route
      logSystem.success('socket_server', 'Socket manager initialized');
    } catch (error) {
      logSystem.error('socket_server', 'Failed to initialize socket manager', error as Error);
    }
  }

  public setServer(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
    logSystem.success('socket_server', 'Socket.IO server configured');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logSystem.success('socket_server', 'New socket connection', {
        socketId: socket.id,
        metadata: { clientIP: socket.handshake.address }
      });

      // Handle user authentication
      socket.on('authenticate', async (data: { token?: string }) => {
        try {
          // In a real implementation, you'd validate the JWT token here
          // For now, we'll use a simple approach
          const user = await this.authenticateUser(data.token);
          
          if (user) {
            const socketUser: SocketUser = {
              userId: user.id,
              role: user.role as 'CLIENT' | 'PROVIDER' | 'ADMIN',
              socketId: socket.id,
              connectedAt: new Date()
            };

            this.connectedUsers.set(socket.id, socketUser);
            this.userSockets.set(user.id, socket.id);

            socket.join(`user_${user.id}`);
            socket.join(`role_${user.role}`);

            logSystem.success('socket_server', 'User authenticated', {
              userId: user.id,
              socketId: socket.id,
              role: user.role
            });

            socket.emit('authenticated', { 
              success: true, 
              userId: user.id, 
              role: user.role 
            });

            // Send any pending notifications
            this.sendPendingNotifications(user.id);
          } else {
            socket.emit('authentication_error', { 
              error: 'Invalid authentication' 
            });
          }
        } catch (error) {
          logSystem.error('socket_server', 'Authentication error', error as Error, {
            socketId: socket.id,
            error_code: 'AUTHENTICATION_FAILED'
          });
          socket.emit('authentication_error', { 
            error: 'Authentication failed' 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          this.connectedUsers.delete(socket.id);
          this.userSockets.delete(user.userId);
          
          logSystem.success('socket_server', 'User disconnected', {
            userId: user.userId,
            socketId: socket.id,
            role: user.role
          });
        }
      });

      // Handle custom events
      socket.on('join_room', (room: string) => {
        socket.join(room);
        logSystem.success('socket_server', 'User joined room', {
          socketId: socket.id,
          room,
          metadata: { user: this.connectedUsers.get(socket.id) }
        });
      });

      socket.on('leave_room', (room: string) => {
        socket.leave(room);
        logSystem.success('socket_server', 'User left room', {
          socketId: socket.id,
          room,
          metadata: { user: this.connectedUsers.get(socket.id) }
        });
      });
    });
  }

  private async authenticateUser(token?: string): Promise<any> {
    try {
      // In a real implementation, you'd validate the JWT token
      // For now, we'll return a mock user for testing
      if (token === 'test_token') {
        return {
          id: 'test_user_123',
          role: 'CLIENT'
        };
      }
      return null;
    } catch (error) {
      logSystem.error('socket_server', 'Token validation failed', error as Error);
      return null;
    }
  }

  private sendPendingNotifications(userId: string) {
    // In a real implementation, you'd fetch pending notifications from the database
    logSystem.success('socket_server', 'Sending pending notifications', {
      userId,
      metadata: { notificationCount: 0 }
    });
  }

  // Public methods for broadcasting events
  public broadcastBookingEvent(event: SocketEvent) {
    if (!this.io) return;

    const eventData = {
      type: 'booking',
      action: event.action,
      data: event.data,
      timestamp: new Date().toISOString()
    };

    if (event.targetUsers && event.targetUsers.length > 0) {
      // Send to specific users
      event.targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('booking_update', eventData);
      });
    } else if (event.broadcastToRole) {
      // Send to specific role
      this.io.to(`role_${event.broadcastToRole}`).emit('booking_update', eventData);
    } else {
      // Broadcast to all connected users
      this.io.emit('booking_update', eventData);
    }

    logSystem.success('socket_server', 'Booking event broadcasted', {
      action: event.action,
      targetUsers: event.targetUsers?.length || 0,
      broadcastRole: event.broadcastToRole,
      metadata: event.data
    });
  }

  public broadcastPaymentEvent(event: SocketEvent) {
    if (!this.io) return;

    const eventData = {
      type: 'payment',
      action: event.action,
      data: event.data,
      timestamp: new Date().toISOString()
    };

    if (event.targetUsers && event.targetUsers.length > 0) {
      event.targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('payment_update', eventData);
      });
    } else if (event.broadcastToRole) {
      this.io.to(`role_${event.broadcastToRole}`).emit('payment_update', eventData);
    } else {
      this.io.emit('payment_update', eventData);
    }

    logSystem.success('socket_server', 'Payment event broadcasted', {
      action: event.action,
      targetUsers: event.targetUsers?.length || 0,
      broadcastRole: event.broadcastToRole,
      metadata: event.data
    });
  }

  public broadcastPayoutEvent(event: SocketEvent) {
    if (!this.io) return;

    const eventData = {
      type: 'payout',
      action: event.action,
      data: event.data,
      timestamp: new Date().toISOString()
    };

    if (event.targetUsers && event.targetUsers.length > 0) {
      event.targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('payout_update', eventData);
      });
    } else if (event.broadcastToRole) {
      this.io.to(`role_${event.broadcastToRole}`).emit('payout_update', eventData);
    } else {
      this.io.emit('payout_update', eventData);
    }

    logSystem.success('socket_server', 'Payout event broadcasted', {
      action: event.action,
      targetUsers: event.targetUsers?.length || 0,
      broadcastRole: event.broadcastToRole,
      metadata: event.data
    });
  }

  public broadcastNotification(event: SocketEvent) {
    if (!this.io) return;

    const eventData = {
      type: 'notification',
      action: event.action,
      data: event.data,
      timestamp: new Date().toISOString()
    };

    if (event.targetUsers && event.targetUsers.length > 0) {
      event.targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('notification', eventData);
      });
    } else if (event.broadcastToRole) {
      this.io.to(`role_${event.broadcastToRole}`).emit('notification', eventData);
    } else {
      this.io.emit('notification', eventData);
    }

    logSystem.success('socket_server', 'Notification broadcasted', {
      action: event.action,
      targetUsers: event.targetUsers?.length || 0,
      broadcastRole: event.broadcastToRole,
      metadata: event.data
    });
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Helper functions for broadcasting events
export const broadcastBookingCreated = (bookingData: any, clientId: string, providerId: string) => {
  socketManager.broadcastBookingEvent({
    type: 'booking',
    action: 'created',
    data: bookingData,
    targetUsers: [clientId, providerId]
  });
};

export const broadcastBookingAccepted = (bookingData: any, clientId: string, providerId: string) => {
  socketManager.broadcastBookingEvent({
    type: 'booking',
    action: 'accepted',
    data: bookingData,
    targetUsers: [clientId, providerId]
  });
};

export const broadcastBookingRejected = (bookingData: any, clientId: string, providerId: string) => {
  socketManager.broadcastBookingEvent({
    type: 'booking',
    action: 'rejected',
    data: bookingData,
    targetUsers: [clientId, providerId]
  });
};

export const broadcastPaymentStatusChange = (paymentData: any, clientId: string, providerId: string) => {
  socketManager.broadcastPaymentEvent({
    type: 'payment',
    action: 'status_changed',
    data: paymentData,
    targetUsers: [clientId, providerId]
  });
};

export const broadcastPayoutStatusChange = (payoutData: any, providerId: string) => {
  socketManager.broadcastPayoutEvent({
    type: 'payout',
    action: 'status_changed',
    data: payoutData,
    targetUsers: [providerId]
  });
};

export const broadcastNotification = (notificationData: any, userId: string) => {
  socketManager.broadcastNotification({
    type: 'notification',
    action: 'new',
    data: notificationData,
    targetUsers: [userId]
  });
};
