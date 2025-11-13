import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { serviceRegistry } from '../services/serviceRegistry';
import { ROUTE_MAPPINGS } from '../config/services';

/**
 * Request Proxy Middleware
 *
 * ANALOGY: This is like the host at a restaurant who:
 * 1. Listens to the customer's request ("I want pizza")
 * 2. Looks up which department handles it (pizza kitchen)
 * 3. Walks the request over to that department
 * 4. Brings back the response to the customer
 *
 * The customer never knows there are multiple kitchens - they just
 * get their food seamlessly!
 */

interface ProxyRequestOptions {
  stripPrefix?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Forward request to target service with retry logic
 */
async function forwardRequest(
  targetUrl: string,
  method: string,
  path: string,
  body: any,
  headers: any,
  options: ProxyRequestOptions = {}
): Promise<any> {
  const { timeout = 5000, retries = 3 } = options;

  let lastError: AxiosError | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const config: AxiosRequestConfig = {
        method: method as any,
        url: `${targetUrl}${path}`,
        data: body,
        headers: {
          ...headers,
          // Remove host header to avoid conflicts
          host: undefined,
          // Forward original client IP
          'X-Forwarded-For': headers['x-forwarded-for'] || headers['x-real-ip'],
          'X-Forwarded-Proto': headers['x-forwarded-proto'] || 'http',
        },
        timeout,
        validateStatus: () => true, // Accept all status codes
        maxRedirects: 5
      };

      const response = await axios(config);

      // Log successful request
      console.log(`✅ ${method} ${path} → ${response.status} (attempt ${attempt})`);

      return response;

    } catch (error: any) {
      lastError = error;
      console.error(
        `❌ Request failed (attempt ${attempt}/${retries}):`,
        error.message
      );

      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Main proxy middleware
 */
export async function proxyRequest(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const startTime = Date.now();
    const { path, method, body, headers } = req;

    // Find which service should handle this route
    const mapping = ROUTE_MAPPINGS.find(m => path.startsWith(m.prefix));

    if (!mapping) {
      res.status(404).json({
        error: 'Route not found',
        message: `No service configured for path: ${path}`
      });
      return;
    }

    // Get service configuration
    const service = serviceRegistry.getService(mapping.serviceName);

    if (!service) {
      res.status(503).json({
        error: 'Service unavailable',
        message: `Service ${mapping.serviceName} not found in registry`
      });
      return;
    }

    // Check if service is healthy
    if (!serviceRegistry.isServiceHealthy(mapping.serviceName)) {
      console.warn(`⚠️  Service ${mapping.serviceName} is unhealthy, attempting anyway...`);
    }

    // Determine the target path
    let targetPath = path;
    if (mapping.stripPrefix) {
      targetPath = path.replace(mapping.prefix, '');
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }
    }

    // Forward the request
    console.log(`🔄 Proxying: ${method} ${path} → ${service.name}${targetPath}`);

    const response = await forwardRequest(
      service.url,
      method,
      targetPath,
      body,
      headers,
      {
        timeout: service.timeout,
        retries: service.retries
      }
    );

    // Calculate request duration
    const duration = Date.now() - startTime;

    // Add custom headers to response
    res.set({
      'X-Gateway-Service': mapping.serviceName,
      'X-Response-Time': `${duration}ms`,
      'X-Request-ID': req.headers['x-request-id'] || generateRequestId()
    });

    // Forward response headers (except hop-by-hop headers)
    const excludeHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade'];
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        res.set(key, value as string);
      }
    });

    // Send response
    res.status(response.status).send(response.data);

    // Log request completion
    console.log(
      `📊 ${method} ${path} completed in ${duration}ms (${response.status})`
    );

  } catch (error: any) {
    console.error('❌ Proxy error:', error.message);

    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Could not connect to service'
      });
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      res.status(504).json({
        error: 'Gateway timeout',
        message: 'Service took too long to respond'
      });
    } else if (error.response) {
      // Forward error response from service
      res.status(error.response.status).send(error.response.data);
    } else {
      // Unknown error
      res.status(500).json({
        error: 'Internal gateway error',
        message: error.message
      });
    }
  }
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
