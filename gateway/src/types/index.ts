/**
 * Service Registry Types
 *
 * Think of these as the "directory" that helps the gateway find services
 */

import { Request } from 'express';

export interface ServiceConfig {
  name: string;           // Service name (e.g., "auth-service")
  url: string;            // Where the service lives (e.g., "http://localhost:3001")
  healthCheck: string;    // Endpoint to check if service is alive
  timeout?: number;       // Max time to wait for response (ms)
  retries?: number;       // How many times to retry on failure
}

export interface RouteMapping {
  prefix: string;         // URL prefix (e.g., "/api/auth")
  serviceName: string;    // Which service handles this route
  stripPrefix?: boolean;  // Remove prefix before forwarding?
  authRequired?: boolean; // Does this route need authentication?
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

export interface GatewayRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  startTime?: number;
}
