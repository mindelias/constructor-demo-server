import { Request, Response, NextFunction } from 'express';
import { GATEWAY_CONFIG } from '../config/services';

/**
 * Rate Limiter Middleware
 *
 * ANALOGY: Think of this like a restaurant's reservation system:
 * - Each customer can only make X reservations per hour
 * - Prevents one person from booking the entire restaurant
 * - Protects against abuse and ensures fair access for everyone
 *
 * This is a simple in-memory rate limiter. In production, you'd
 * use Redis for distributed rate limiting across multiple gateway instances.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Rate limiting middleware
 */
export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Identify the client (by IP or user ID if authenticated)
  const clientId = getClientIdentifier(req);

  // Get or create rate limit entry
  const now = Date.now();
  let entry = rateLimitStore.get(clientId);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    entry = {
      count: 0,
      resetTime: now + GATEWAY_CONFIG.rateLimit.windowMs
    };
    rateLimitStore.set(clientId, entry);
  }

  // Increment request count
  entry.count++;

  // Calculate remaining requests
  const remaining = Math.max(0, GATEWAY_CONFIG.rateLimit.max - entry.count);
  const resetTime = new Date(entry.resetTime).toISOString();

  // Add rate limit headers to response
  res.set({
    'X-RateLimit-Limit': GATEWAY_CONFIG.rateLimit.max.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime
  });

  // Check if limit exceeded
  if (entry.count > GATEWAY_CONFIG.rateLimit.max) {
    console.warn(`⚠️  Rate limit exceeded for ${clientId}`);

    res.status(429).json({
      error: 'Too many requests',
      message: `You have exceeded the rate limit of ${GATEWAY_CONFIG.rateLimit.max} requests per ${GATEWAY_CONFIG.rateLimit.windowMs / 1000}s`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
    return;
  }

  next();
}

/**
 * Get client identifier for rate limiting
 * Prefers user ID if authenticated, falls back to IP address
 */
function getClientIdentifier(req: Request): string {
  // Use user ID if authenticated
  const userId = req.headers['x-user-id'];
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Custom rate limiter with different limits
 */
export function createRateLimiter(windowMs: number, max: number) {
  const store = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    let entry = store.get(clientId);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      store.set(clientId, entry);
    }

    entry.count++;
    const remaining = Math.max(0, max - entry.count);

    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
    });

    if (entry.count > max) {
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded`,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    next();
  };
}
