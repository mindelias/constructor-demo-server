import { ServiceConfig, RouteMapping } from '../types';

/**
 * Service Registry Configuration
 *
 * ANALOGY: This is like a restaurant's internal phone directory
 * - Need to verify a membership? Call extension 3001 (auth-service)
 * - Need to check the menu? Call extension 3002 (product-service)
 * - Need to process an order? Call extension 3003 (order-service)
 *
 * For now, all services point to the same monolith (port 3000)
 * Later, we'll split them into separate microservices
 */

export const SERVICES: ServiceConfig[] = [
  {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
    healthCheck: '/health',
    timeout: 5000,      // Wait up to 5 seconds
    retries: 3          // Try up to 3 times if it fails
  },
  {
    name: 'product-service',
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000',
    healthCheck: '/health',
    timeout: 5000,
    retries: 3
  },
  {
    name: 'order-service',
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3000',
    healthCheck: '/health',
    timeout: 5000,
    retries: 3
  },
  {
    name: 'recommendation-service',
    url: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3000',
    healthCheck: '/health',
    timeout: 10000,     // Recommendations can be slower (ML processing)
    retries: 2
  }
];

/**
 * Route Mappings
 *
 * ANALOGY: This is the host stand's routing guide
 * - Customer asks for "authentication"? → Send to auth-service
 * - Customer asks for "products"? → Send to product-service
 * - Customer asks for "orders"? → Send to order-service
 *
 * The stripPrefix option removes the service name from the URL
 * Example: /api/products/123 → forwards as /api/products/123 (keep prefix)
 */

export const ROUTE_MAPPINGS: RouteMapping[] = [
  {
    prefix: '/api/auth',
    serviceName: 'auth-service',
    stripPrefix: false,
    authRequired: false   // Login/register don't need auth
  },
  {
    prefix: '/api/products',
    serviceName: 'product-service',
    stripPrefix: false,
    authRequired: false   // Browsing products is public
  },
  {
    prefix: '/api/orders',
    serviceName: 'order-service',
    stripPrefix: false,
    authRequired: true    // Must be logged in to order
  },
  {
    prefix: '/api/recommendations',
    serviceName: 'recommendation-service',
    stripPrefix: false,
    authRequired: false   // Can get recommendations without login
  }
];

/**
 * Gateway Configuration
 */
export const GATEWAY_CONFIG = {
  port: process.env.GATEWAY_PORT || 8080,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                    // Max 100 requests per window
  },
  healthCheckInterval: 30000,   // Check service health every 30 seconds
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
};
