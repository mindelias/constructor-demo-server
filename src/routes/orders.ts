 import { Router, Response } from 'express';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { authMiddleware } from '@/middleware/auth';
import { AuthRequest } from '@/types';

const router = Router();

// Create order
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { items, shippingAddress } = req.body;

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productId} not found`
        });
      }

      if (product.inventory < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient inventory for ${product.name}`
        });
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      status: 'pending'
    });

    await order.save();

    // Update product inventory
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { 
          inventory: -item.quantity,
          'stats.purchases': 1
        }
      });
    }

    // Update user purchase history
    await User.findByIdAndUpdate(userId, {
      $push: {
        purchaseHistory: {
          orderId: order._id,
          purchasedAt: new Date()
        }
      }
    });

    // Emit order event for real-time dashboard
    const io = req.app.get('io');
    io?.emit('new_order', {
      orderId: order._id,
      userId,
      totalAmount,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Get user's orders
router.get('/my-orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('items.productId', 'name price images')
        .lean(),
      Order.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      data: orders,
      metadata: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Get order by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const order = await Order.findOne({ _id: id, userId })
      .populate('items.productId')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Update order status (simplified - would be admin only)
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Emit status update
    const io = req.app.get('io');
    io?.to(`user_${order.userId}`).emit('order_status_updated', {
      orderId: id,
      status,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

export default router;