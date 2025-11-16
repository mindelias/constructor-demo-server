import { Request } from 'express';
import { Document, Types } from 'mongoose';
import { Socket } from 'socket.io';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  preferences: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
  viewHistory: Array<{
    productId: Types.ObjectId;
    viewedAt: Date;
    duration: number;
  }>;
  purchaseHistory: Array<{
    orderId: Types.ObjectId;
    purchasedAt: Date;
  }>;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

// Product types
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category: string;
  tags: string[];
  images: string[];
  inventory: number;
  features: {
    brand?: string;
    color?: string;
    size?: string[];
    material?: string;
  };
  stats: {
    views: number;
    purchases: number;
    rating: number;
    reviewCount: number;
  };
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: Array<{
    productId: Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
}

// Extended Request with user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Socket with user data
export interface AuthSocket extends Socket {
  userId?: string;
}

// Recommendation types
export interface RecommendationRequest {
  user: any; // Can be IUser or lean user object
  limit: number;
  category?: string | null;
  strategy: 'collaborative' | 'content-based' | 'hybrid';
}

export interface RecommendationResponse {
  productId: string;
  score: number;
  reason: string;
  product?: IProduct;
}

// Analytics Event
export interface AnalyticsEvent {
  userId: string;
  event: string;
  data: Record<string, any>;
  timestamp: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    source?: string;
    strategy?: string;
    personalized?: boolean;
    [key: string]: any;
  };
}

// Service Response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: Error | string;
}