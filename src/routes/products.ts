import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, optionalAuth } from '@/middleware/auth';
import { getRedisClient } from '@/config/redis';
import Product from '@/models/Product';
import { ApiResponse, IProduct, AuthRequest } from '@/types';

const router = Router();

// Validation middleware for creating products
const validateProduct = [
  body('name').notEmpty().trim().withMessage('Product name is required'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().trim().withMessage('Category is required'),
  body('inventory').isInt({ min: 0 }).withMessage('Inventory must be a non-negative integer'),
];

// Get all products with filters
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter: any = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      metadata: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    const cacheKey = `product:${id}`;

    // Check cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          source: 'cache'
        });
      }
    }

    // Get from database
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Update view count
    await Product.findByIdAndUpdate(id, {
      $inc: { 'stats.views': 1 }
    });

    // Cache for 1 hour
    if (redis) {
      await redis.setex(cacheKey, 3600, JSON.stringify(product));
    }

    // Track user view if authenticated
    if (req.user) {
      // Emit event for analytics
      const io = req.app.get('io');
      io?.emit('product_viewed', {
        userId: req.user.userId,
        productId: id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// Create product (admin only - simplified for demo)
router.post('/', authMiddleware, validateProduct, async (req: AuthRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const productData = req.body;
    
    const product = new Product(productData);
    await product.save();

    // Invalidate cache
    const redis = getRedisClient();
    if (redis) {
      await redis.del('products:*');
    }

    res.status(201).json({
      success: true,
      data: product
    });

  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// Search products
router.get('/search/autocomplete', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q as string, 'i')] } }
      ]
    })
    .select('name category price images')
    .limit(10)
    .lean();

    res.json({
      success: true,
      data: products
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Get trending products
router.get('/trending/now', async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const cacheKey = 'products:trending';

    // Check cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          source: 'cache'
        });
      }
    }

    // Get trending based on views and recent purchases
    const trending = await Product.find()
      .sort({ 'stats.views': -1, 'stats.purchases': -1 })
      .limit(20)
      .lean();

    // Cache for 30 minutes
    if (redis) {
      await redis.setex(cacheKey, 1800, JSON.stringify(trending));
    }

    res.json({
      success: true,
      data: trending
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending products'
    });
  }
});

export default router;