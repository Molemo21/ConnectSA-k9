/**
 * Custom Next.js Server with Socket.IO Integration
 * 
 * This server initializes Socket.IO alongside Next.js for real-time functionality.
 * It's designed for production deployment with proper WebSocket support.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO server
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: dev 
        ? ['http://localhost:3000', 'http://localhost:3001']
        : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Store Socket.IO server globally for API routes
  global.socketIO = io;

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    // Handle user authentication
    socket.on('authenticate', (data) => {
      try {
        const { userId, role } = data;
        
        // Join user-specific and role-based rooms
        socket.join(`user_${userId}`);
        socket.join(`role_${role.toLowerCase()}`);

        socket.emit('authenticated', { success: true, userId, role });
        
        console.log('✅ User authenticated:', { userId, role, socketId: socket.id });
      } catch (error) {
        socket.emit('auth_error', { error: 'Authentication failed' });
        console.error('❌ Authentication failed:', error);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle join room requests
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log('🏠 User joined room:', room, 'Socket:', socket.id);
    });

    // Handle leave room requests
    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log('🚪 User left room:', room, 'Socket:', socket.id);
    });
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.IO server running on path: /api/socket`);
    console.log(`📡 Environment: ${dev ? 'development' : 'production'}`);
  });
});
