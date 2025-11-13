import { Request, Response, NextFunction } from 'express';
import Product from '@/models/Product';
import User from '@/models/User';
import { getRedisClient } from '@/config/redis';
import recommendationEngine from '@/services/recommendationEngine';
import { AuthRequest, ApiResponse, RecommendationResponse } from '@/types';

class RecommendationController {
  async getRecommendations(
    req: AuthRequest,
    res: Response<ApiResponse<RecommendationResponse[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const { 
        limit = '10', 
        category = null 
      } = req.query as { limit?: string; category?: string };
      
      const redis = getRedisClient();
      const cacheKey = `recommendations:${userId}:${category || 'all'}:${limit}`;
      
      // Type-safe cache check
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          res.json({
            success: true,
            data: JSON.parse(cached),
            metadata: { source: 'cache' }
          });
          return;
        }
      }
      
      // Get user with proper typing
      const user = await User.findById(userId)
        .select('preferences viewHistory purchaseHistory')
        .lean();
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Generate recommendations
      const recommendations = await recommendationEngine.generate({
        user,
        limit: parseInt(limit),
        category,
        strategy: 'hybrid'
      });
      
      // Cache with error handling
      if (redis) {
        await redis.setex(cacheKey, 3600, JSON.stringify(recommendations))
          .catch(err => console.error('Redis cache error:', err));
      }
      
      // Emit analytics event
      const io = req.app.get('io');
      if (io) {
        io.emit('analytics', {
          event: 'recommendations_generated',
          userId,
          count: recommendations.length,
          timestamp: new Date()
        });
      }
      
      res.json({
        success: true,
        data: recommendations,
        metadata: {
          source: 'computed',
          strategy: 'hybrid',
          personalized: true
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  async trackInteraction(
    req: AuthRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { 
        productId, 
        action, 
        duration 
      } = req.body as {
        productId: string;
        action: 'view' | 'click' | 'purchase';
        duration?: number;
      };
      
      // Validate input
      if (!userId || !productId || !action) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }
      
      // Update user's view history
      if (action === 'view' && duration) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            viewHistory: {
              productId,
              duration,
              viewedAt: new Date()
            }
          }
        });
      }
      
      // Update product stats
      const updateField = `stats.${action === 'view' ? 'views' : 'clicks'}`;
      await Product.findByIdAndUpdate(productId, {
        $inc: { [updateField]: 1 }
      });
      
      // Emit real-time event
      const io = req.app.get('io');
      io?.to(`user_${userId}`).emit('interaction_tracked', {
        productId,
        action,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: 'Interaction tracked successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
}

export default new RecommendationController();