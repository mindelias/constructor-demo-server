import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { GATEWAY_CONFIG } from './config/services';
import { conditionalAuth } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import { proxyRequest } from './middleware/proxy';
import healthCheckRouter from './utils/healthCheck';

/**
 * API Gateway Application
 *
 * ANALOGY: This is the restaurant's front-of-house setup:
 * - Front door (CORS) - who's allowed to enter
 * - Security system (Helmet) - protects against common threats
 * - Reservation system (Rate limiting) - prevents overcrowding
 * - Host stand (Request routing) - directs customers to the right place
 * - Manager's office (Health checks) - monitoring and diagnostics
 */

const app: Application = express();

// ==========================================
// 1. SECURITY & BASIC MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: GATEWAY_CONFIG.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response compression
app.use(compression());

// ==========================================
// 2. LOGGING
// ==========================================

app.use(requestLogger);

// ==========================================
// 3. HEALTH CHECK ROUTES (No auth/rate limiting)
// ==========================================

app.use(healthCheckRouter);

// ==========================================
// 4. RATE LIMITING
// ==========================================

app.use(rateLimiter);

// ==========================================
// 5. WELCOME ROUTE
// ==========================================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: '🚪 Welcome to the API Gateway',
    version: '1.0.0',
    documentation: '/status',
    endpoints: {
      health: '/health',
      ready: '/ready',
      live: '/live',
      status: '/status',
      services: '/services'
    },
    routes: {
      auth: '/api/auth/*',
      products: '/api/products/*',
      orders: '/api/orders/*',
      recommendations: '/api/recommendations/*'
    }
  });
});

// ==========================================
// 6. API ROUTES (With conditional auth)
// ==========================================

// Apply conditional authentication based on route configuration
app.use('/api', conditionalAuth);

// Proxy all API requests to appropriate services
app.use('/api', proxyRequest);

// ==========================================
// 7. ERROR HANDLING
// ==========================================

// 404 Handler - route not found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error logger
app.use(errorLogger);

// Global error handler
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Unhandled error:', error);

  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default app;
