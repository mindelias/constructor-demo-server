import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

interface CustomError extends Error {
  status?: number;
  code?: string | number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error for debugging
  console.error(`[Error] ${req.method} ${req.path}:`, err);
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      error: 'Duplicate entry found',
      message: 'This record already exists'
    });
    return;
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message
    });
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Please authenticate'
    });
    return;
  }
  
  // Default error response
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};