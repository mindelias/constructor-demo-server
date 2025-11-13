import { Router } from 'express';
import recommendationController from '@/controllers/recommendationController';
import { authMiddleware, optionalAuth } from '@/middleware/auth';
import { rateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Get personalized recommendations
router.get(
  '/',
  authMiddleware,
  rateLimiter({ maxRequests: 100, windowMs: 60000 }), // 100 requests per minute
  recommendationController.getRecommendations
);

// Track user interaction
router.post(
  '/track',
  authMiddleware,
  recommendationController.trackInteraction
);

// Get similar products
router.get('/similar/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    // This would use your ML service
    // For demo, we'll return products from same category
    const Product = require('@/models/Product').default;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const similar = await Product.find({
      category: product.category,
      _id: { $ne: productId }
    })
    .limit(Number(limit))
    .lean();

    res.json({
      success: true,
      data: similar
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get similar products'
    });
  }
});

// Get recommendations by strategy
router.get('/strategy/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params; // 'collaborative', 'content-based', 'trending'
    
    // Implementation would vary by strategy
    res.json({
      success: true,
      data: [],
      strategy: type
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

export default router;