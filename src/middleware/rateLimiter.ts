import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@/config/redis';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
}

export const rateLimiter = (options: RateLimiterOptions) => {
  const { maxRequests, windowMs, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const redis = getRedisClient();
    
    // Skip if Redis is not available
    if (!redis) {
      return next();
    }

    const key = keyGenerator 
      ? keyGenerator(req)
      : `rate_limit:${req.ip}:${req.path}`;

    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: windowMs / 1000
        });
        return;
      }

      // Add headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - current).toString());
      
      next();
    } catch (error) {
      // Continue on error
      next();
    }
  };
};