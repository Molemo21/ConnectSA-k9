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

/**
 * Check if an error is a OneDrive file lock error
 */
function isOneDriveLockError(error) {
  if (!error) return false;
  
  // Handle string errors
  if (typeof error === 'string') {
    return error.includes('UNKNOWN: unknown error') &&
           error.includes('errno: -4094') &&
           (error.includes('.next-dev') || error.includes('.next'));
  }
  
  // Handle object errors
  if (typeof error !== 'object') return false;
  
  const errno = error.errno;
  const code = error.code || '';
  const path = error.path || '';
  const message = error.message || '';
  
  // Check for OneDrive lock error characteristics
  const hasOneDriveErrno = errno === -4094;
  const hasUnknownCode = code === 'UNKNOWN';
  const hasNextPath = path.includes('.next-dev') || path.includes('.next');
  const hasNextMessage = message.includes('.next-dev') || message.includes('.next');
  
  return (
    (hasOneDriveErrno && hasUnknownCode) ||
    (hasOneDriveErrno && hasNextPath) ||
    (hasOneDriveErrno && hasNextMessage) ||
    (hasUnknownCode && hasNextPath && hasOneDriveErrno)
  );
}

/**
 * Filter OneDrive errors from console output
 */
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function(...args) {
  // Check if any argument contains OneDrive lock error
  const shouldSuppress = args.some(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return isOneDriveLockError(arg);
    }
    if (typeof arg === 'string') {
      return arg.includes('UNKNOWN: unknown error') && 
             arg.includes('errno: -4094') &&
             (arg.includes('.next-dev') || arg.includes('.next'));
    }
    return false;
  });
  
  if (!shouldSuppress) {
    originalConsoleError.apply(console, args);
  }
  // Silently suppress OneDrive errors
};

console.warn = function(...args) {
  // Check if any argument contains OneDrive lock error
  const shouldSuppress = args.some(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return isOneDriveLockError(arg);
    }
    if (typeof arg === 'string') {
      return arg.includes('UNKNOWN: unknown error') && 
             arg.includes('errno: -4094') &&
             (arg.includes('.next-dev') || arg.includes('.next'));
    }
    return false;
  });
  
  if (!shouldSuppress) {
    originalConsoleWarn.apply(console, args);
  }
  // Silently suppress OneDrive warnings
};

/**
 * Process-level error handlers to catch unhandled errors
 */
process.on('uncaughtException', (error) => {
  if (isOneDriveLockError(error)) {
    // Silently suppress OneDrive errors
    return;
  }
  // Log other uncaught exceptions
  originalConsoleError('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  if (isOneDriveLockError(reason)) {
    // Silently suppress OneDrive promise rejections
    return;
  }
  // Log other unhandled rejections
  originalConsoleError('Unhandled Rejection at:', promise, 'reason:', reason);
});

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
      // Suppress noisy OneDrive file lock errors (-4094 on Windows)
      if (isOneDriveLockError(err)) {
        // For OneDrive lock errors, just retry or return gracefully
        // The file will be available on next request
        res.statusCode = 503;
        res.end('Service temporarily unavailable - file sync in progress');
        return;
      }
      
      // Log and handle other errors
      originalConsoleError('Error occurred handling', req.url, err);
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
