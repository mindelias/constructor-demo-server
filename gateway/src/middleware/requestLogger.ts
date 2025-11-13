import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 *
 * ANALOGY: This is like the restaurant's logbook where the host writes:
 * - "8:30 PM - Table 5 ordered 2 pizzas - served in 15 minutes"
 * - "9:00 PM - Customer complained about cold food - resolved"
 *
 * Helps you track what's happening, debug issues, and analyze patterns
 */

/**
 * Color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Get color based on HTTP status code
 */
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;      // Server errors
  if (status >= 400) return colors.yellow;   // Client errors
  if (status >= 300) return colors.cyan;     // Redirects
  if (status >= 200) return colors.green;    // Success
  return colors.reset;
}

/**
 * Get color based on response time
 */
function getResponseTimeColor(ms: number): string {
  if (ms < 100) return colors.green;         // Fast
  if (ms < 500) return colors.yellow;        // Acceptable
  return colors.red;                         // Slow
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Record start time
  const startTime = Date.now();
  (req as any).startTime = startTime;

  // Get request details
  const { method, path } = req;
  const userId = req.headers['x-user-id'] || 'anonymous';

  // Log incoming request
  console.log(
    `${colors.blue}➡️  ${method}${colors.reset} ${path} ` +
    `${colors.gray}(${userId})${colors.reset}`
  );

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    // Calculate response time
    const duration = Date.now() - startTime;

    // Get response size
    const size = data ? Buffer.byteLength(JSON.stringify(data)) : 0;
    const sizeKb = (size / 1024).toFixed(2);

    // Log completed request
    const statusColor = getStatusColor(res.statusCode);
    const timeColor = getResponseTimeColor(duration);

    console.log(
      `${statusColor}⬅️  ${res.statusCode}${colors.reset} ` +
      `${method} ${path} ` +
      `${timeColor}${duration}ms${colors.reset} ` +
      `${colors.gray}${sizeKb}kb${colors.reset}`
    );

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error logging middleware
 */
export function errorLogger(
  error: any,
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { method, path } = req;
  const duration = Date.now() - ((req as any).startTime || Date.now());

  console.error(
    `${colors.red}❌ ERROR${colors.reset} ` +
    `${method} ${path} ` +
    `${colors.red}${duration}ms${colors.reset}\n` +
    `${colors.gray}${error.stack}${colors.reset}`
  );

  next(error);
}

/**
 * Access log formatter (like Apache/Nginx logs)
 *
 * Format: [timestamp] method path status duration userAgent
 */
export function accessLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  (req as any).startTime = startTime;

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const { method, path } = req;
    const userAgent = req.headers['user-agent'] || '-';
    const userId = req.headers['x-user-id'] || '-';

    // Log in Apache-like format
    console.log(
      `[${timestamp}] ` +
      `"${method} ${path}" ` +
      `${res.statusCode} ` +
      `${duration}ms ` +
      `user=${userId} ` +
      `"${userAgent}"`
    );

    return originalSend.call(this, data);
  };

  next();
}
