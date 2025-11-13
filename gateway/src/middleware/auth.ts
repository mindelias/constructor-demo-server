import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GATEWAY_CONFIG } from '../config/services';

/**
 * Gateway Authentication Middleware
 *
 * ANALOGY: Think of this as the bouncer at a nightclub:
 * - Checks your ID (JWT token) at the door
 * - If valid, you get a wristband (user info added to request)
 * - If invalid or missing, you don't get in
 *
 * This happens BEFORE the request even reaches the actual service!
 */

export interface JWTPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided'
      });
      return;
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization format. Expected: Bearer <token>'
      });
      return;
    }

    // Extract the actual token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, GATEWAY_CONFIG.jwtSecret) as JWTPayload;

    // Attach user info to request for downstream services
    (req as any).user = {
      id: decoded.id,
      email: decoded.email
    };

    // Add user ID to headers for services to use
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-email'] = decoded.email;

    console.log(`🔐 Authenticated user: ${decoded.email} (${decoded.id})`);

    next();

  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    } else {
      res.status(500).json({
        error: 'Authentication error',
        message: 'Could not authenticate request'
      });
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token
 *
 * ANALOGY: Like a museum that's free to enter, but if you show
 * your membership card, you get extra benefits
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // No token? That's okay, just continue
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, GATEWAY_CONFIG.jwtSecret) as JWTPayload;

    (req as any).user = {
      id: decoded.id,
      email: decoded.email
    };

    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-email'] = decoded.email;

    console.log(`🔐 Optional auth: ${decoded.email}`);

  } catch (error) {
    // Token is invalid, but that's okay for optional auth
    console.log('⚠️  Invalid token in optional auth, continuing without user');
  }

  next();
}

/**
 * Middleware to enforce authentication based on route configuration
 */
export function conditionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Import route mappings
  const { ROUTE_MAPPINGS } = require('../config/services');

  const mapping = ROUTE_MAPPINGS.find((m: any) =>
    req.path.startsWith(m.prefix)
  );

  if (mapping?.authRequired) {
    // This route requires authentication
    authenticateRequest(req, res, next);
  } else {
    // This route doesn't require auth, but we'll try to authenticate anyway
    optionalAuth(req, res, next);
  }
}
