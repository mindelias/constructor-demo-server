import 'module-alias/register';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { connectRedis } from './config/redis';
import app from './app';
import { AuthSocket } from './types';
import connectDB from './config/database';


const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with TypeScript types
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Make io accessible throughout the app
app.set('io', io);

// Socket connection handler with proper typing
io.on('connection', (socket: AuthSocket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join_user_room', (userId: string) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('track_event', (event: any) => {
    // Type-safe event handling
    console.log('Event tracked:', event);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await connectRedis();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});