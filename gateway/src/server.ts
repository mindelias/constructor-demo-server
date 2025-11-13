import dotenv from 'dotenv';
import app from './app';
import { GATEWAY_CONFIG } from './config/services';
import { serviceRegistry } from './services/serviceRegistry';

// Load environment variables
dotenv.config();

/**
 * API Gateway Server
 *
 * ANALOGY: This is like opening the restaurant for business:
 * - Turn on the lights (start server)
 * - Check that all departments are ready (health checks)
 * - Start taking customer reservations (accept requests)
 */

const PORT = GATEWAY_CONFIG.port;

async function startServer() {
  try {
    console.log('');
    console.log('🚀 Starting API Gateway...');
    console.log('================================');

    // Start health checks for all services
    console.log('🏥 Initializing service health monitoring...');
    serviceRegistry.startHealthChecks();

    // Give services a moment to check health
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('✅ API Gateway is running!');
      console.log('================================');
      console.log(`📍 Gateway URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`📈 Status Dashboard: http://localhost:${PORT}/status`);
      console.log(`📋 Service List: http://localhost:${PORT}/services`);
      console.log('');
      console.log('📡 Proxying routes:');
      console.log('   /api/auth/*              → auth-service');
      console.log('   /api/products/*          → product-service');
      console.log('   /api/orders/*            → order-service');
      console.log('   /api/recommendations/*   → recommendation-service');
      console.log('');
      console.log('Press Ctrl+C to stop');
      console.log('================================');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log('');
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      // Stop health checks
      serviceRegistry.stopHealthChecks();

      // Close server
      server.close(() => {
        console.log('✅ Gateway closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start gateway:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
