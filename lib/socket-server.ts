/**
 * Socket.IO Server Management
 * 
 * Provides centralized WebSocket functionality with:
 * - User authentication and room management
 * - Event broadcasting for real-time updates
 * - Connection lifecycle management
 * - Integration with logging system
 */

import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@/lib/logger';

interface SocketUser {
  id: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

interface SocketEvent {
  type: 'booking' | 'payment' | 'payout' | 'notification';
  action: string;
  data: any;
  timestamp: string;
  targetUsers?: string[];
}

// Singleton SocketManager for centralized connection handling
class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, string> = new Map();

  public initialize(server: any): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.success('socket_server', 'Socket.IO server initialized', {
      transports: ['websocket', 'polling'],
      cors_origin: this.io.engine.opts.cors?.origin
    });

    return this.io;
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info('socket_connection', 'New socket connection', {
        socketId: socket.id,
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      });

      // Handle user authentication
      socket.on('authenticate', (data: { token: string; userId: string; role: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle user disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle join room requests
      socket.on('join_room', (room: string) => {
        socket.join(room);
        logger.info('socket_room_join', 'User joined room', {
          socketId: socket.id,
          room,
          userId: this.getUserIdBySocketId(socket.id)
        });
      });

      // Handle leave room requests
      socket.on('leave_room', (room: string) => {
        socket.leave(room);
        logger.info('socket_room_leave', 'User left room', {
          socketId: socket.id,
          room,
          userId: this.getUserIdBySocketId(socket.id)
        });
      });
    });
  }

  private handleAuthentication(socket: any, data: { token: string; userId: string; role: string }): void {
    try {
      // In production, validate JWT token here
      const { userId, role } = data;
      
      const user: SocketUser = {
        id: userId,
        role: role as 'CLIENT' | 'PROVIDER' | 'ADMIN',
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      this.connectedUsers.set(userId, user);
      this.userSockets.set(socket.id, userId);

      // Join user-specific and role-based rooms
      socket.join(`user_${userId}`);
      socket.join(`role_${role.toLowerCase()}`);

      socket.emit('authenticated', { success: true, userId, role });
      
      logger.success('socket_auth', 'User authenticated', {
        userId,
        role,
        socketId: socket.id,
        connectedUsers: this.connectedUsers.size
      });
    } catch (error) {
      socket.emit('auth_error', { error: 'Authentication failed' });
      logger.error('socket_auth', 'Authentication failed', error as Error, {
        socketId: socket.id,
        userId: data.userId
      });
    }
  }

  private handleDisconnection(socket: any, reason: string): void {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      
      logger.info('socket_disconnect', 'User disconnected', {
        userId,
        socketId: socket.id,
        reason,
        remainingUsers: this.connectedUsers.size
      });
    }
  }

  private getUserIdBySocketId(socketId: string): string | undefined {
    return this.userSockets.get(socketId);
  }

  // Event broadcasting methods
  public broadcastBookingEvent(event: SocketEvent): void {
    if (!this.io) return;

    const { type, action, data, targetUsers, timestamp } = event;
    
    if (targetUsers && targetUsers.length > 0) {
      // Broadcast to specific users
      targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('booking_update', {
          type,
          action,
          data,
          timestamp
        });
      });
    } else {
      // Broadcast to all connected users
      this.io.emit('booking_update', {
        type,
        action,
        data,
        timestamp
      });
    }

    logger.info('socket_broadcast', 'Booking event broadcasted', {
      type,
      action,
      targetUsers: targetUsers?.length || 'all',
      timestamp
    });
  }

  public broadcastPaymentEvent(event: SocketEvent): void {
    if (!this.io) return;

    const { type, action, data, targetUsers, timestamp } = event;
    
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('payment_update', {
          type,
          action,
          data,
          timestamp
        });
      });
    } else {
      this.io.emit('payment_update', {
        type,
        action,
        data,
        timestamp
      });
    }

    logger.info('socket_broadcast', 'Payment event broadcasted', {
      type,
      action,
      targetUsers: targetUsers?.length || 'all',
      timestamp
    });
  }

  public broadcastPayoutEvent(event: SocketEvent): void {
    if (!this.io) return;

    const { type, action, data, targetUsers, timestamp } = event;
    
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('payout_update', {
          type,
          action,
          data,
          timestamp
        });
      });
    } else {
      this.io.emit('payout_update', {
        type,
        action,
        data,
        timestamp
      });
    }

    logger.info('socket_broadcast', 'Payout event broadcasted', {
      type,
      action,
      targetUsers: targetUsers?.length || 'all',
      timestamp
    });
  }

  public broadcastNotification(event: SocketEvent): void {
    if (!this.io) return;

    const { type, action, data, targetUsers, timestamp } = event;
    
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.io?.to(`user_${userId}`).emit('notification', {
          type,
          action,
          data,
          timestamp
        });
      });
    } else {
      this.io.emit('notification', {
        type,
        action,
        data,
        timestamp
      });
    }

    logger.info('socket_broadcast', 'Notification broadcasted', {
      type,
      action,
      targetUsers: targetUsers?.length || 'all',
      timestamp
    });
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserCount(): number {
    return this.connectedUsers.size;
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

// Singleton instance
const socketManager = new SocketManager();

// Export functions for API routes
export function initSocketServer(server: any): SocketIOServer {
  return socketManager.initialize(server);
}

export function getSocketServer(): SocketIOServer | null {
  // Try to get from singleton first
  if (socketManager['io']) {
    return socketManager['io'];
  }
  
  // Fallback to global instance (for custom server setup)
  if (typeof global !== 'undefined' && (global as any).socketIO) {
    return (global as any).socketIO;
  }
  
  return null;
}

export function broadcastBookingUpdate(bookingId: string, action: string, data: any, targetUsers?: string[]) {
  const event: SocketEvent = {
    type: 'booking',
    action,
    data,
    timestamp: new Date().toISOString(),
    targetUsers
  };
  
  socketManager.broadcastBookingEvent(event);
}

export function broadcastPaymentUpdate(paymentId: string, action: string, data: any, targetUsers?: string[]) {
  const event: SocketEvent = {
    type: 'payment',
    action,
    data,
    timestamp: new Date().toISOString(),
    targetUsers
  };
  
  socketManager.broadcastPaymentEvent(event);
}

export function broadcastPayoutUpdate(payoutId: string, action: string, data: any, targetUsers?: string[]) {
  const event: SocketEvent = {
    type: 'payout',
    action,
    data,
    timestamp: new Date().toISOString(),
    targetUsers
  };
  
  socketManager.broadcastPayoutEvent(event);
}

export function broadcastNotification(userIds: string[], type: string, title: string, message: string) {
  const event: SocketEvent = {
    type: 'notification',
    action: 'new_notification',
    data: { type, title, message },
    timestamp: new Date().toISOString(),
    targetUsers: userIds
  };
  
  socketManager.broadcastNotification(event);
}

// Legacy functions for backward compatibility
export function broadcastBookingAccepted(booking: any, clientId: string, providerId: string) {
  broadcastBookingUpdate(booking.id, 'accepted', booking, [clientId, providerId]);
}

export function broadcastPaymentStatusChange(payment: any, clientId: string, providerId: string) {
  broadcastPaymentUpdate(payment.id, 'status_changed', payment, [clientId, providerId]);
}

export function broadcastPayoutStatusChange(payout: any, providerId: string) {
  broadcastPayoutUpdate(payout.id, 'status_changed', payout, [providerId]);
}