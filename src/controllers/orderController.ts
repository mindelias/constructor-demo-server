import Order from "@/models/Order";
import Product from "@/models/Product";
import { Request, Response } from "express";

import User from "@/models/User";

import { validationResult } from "express-validator";
interface AuthRequest extends Request {
  user?: {
    userId: string;

    email: string;
  };
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  // Check validation errors

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,

      errors: errors.array(),
    });
  }

  try {
    const userId = req.user?.userId;

    const { items, shippingAddress, paymentMethod = "simulated" } = req.body;

    // Validate items and calculate total

    let totalAmount = 0;

    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({
          success: false,

          error: `Product ${item.productId} not found`,
        });
      }

      if (product.inventory < item.quantity) {
        return res.status(400).json({
          success: false,

          error: `Insufficient inventory for ${product.name}. Available: ${product.inventory}`,
        });
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        productId: item.productId,

        quantity: item.quantity,

        price: product.price,
      });
    }

    // Generate unique payment reference

    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order

    const order = new Order({
      userId,

      items: orderItems,

      totalAmount,

      shippingAddress,

      status: "pending",

      paymentMethod,

      paymentStatus: "pending",

      paymentReference,
    });

    await order.save();

    // Update product inventory

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          inventory: -item.quantity,

          "stats.purchases": 1,
        },
      });
    }

    // Update user purchase history

    await User.findByIdAndUpdate(userId, {
      $push: {
        purchaseHistory: {
          orderId: order._id,

          purchasedAt: new Date(),
        },
      },
    });

    // Populate product details for response

    await order.populate("items.productId", "name price images");

    // Emit order event for real-time dashboard

    const io = req.app.get("io");

    if (io) {
      io.emit("new_order", {
        orderId: order._id,

        userId,

        totalAmount,

        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,

      data: order,

      paymentReference,
    });
  } catch (error: any) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to create order",

      message: error.message,
    });
  }
};

// Get user's orders (paginated)
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ userId })

        .sort("-createdAt")

        .skip(skip)

        .limit(Number(limit))

        .populate("items.productId", "name price images")

        .lean(),

      Order.countDocuments({ userId }),
    ]);

    res.json({
      success: true,

      data: orders,

      metadata: {
        page: Number(page),

        limit: Number(limit),

        total,

        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Get my orders error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to fetch orders",

      message: error.message,
    });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const orders = await Order.find({ userId })

      .sort("-createdAt")

      .populate("items.productId", "name price images")

      .lean();

    res.json({
      success: true,

      data: orders,
    });
  } catch (error: any) {
    console.error("Get orders error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to fetch orders",

      message: error.message,
    });
  }
};
// Get order by ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userId = req.user?.userId;

    const order = await Order.findOne({ _id: id, userId })

      .populate("items.productId")

      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,

        error: "Order not found",
      });
    }

    res.json({
      success: true,

      data: order,
    });
  } catch (error: any) {
    console.error("Get order by ID error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to fetch order",

      message: error.message,
    });
  }
};

// Update order status

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { status, note } = req.body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,

        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,

        error: "Order not found",
      });
    }

    // Update status

    order.status = status;

    // Add to status history

    order.statusHistory.push({
      status,

      timestamp: new Date(),

      note: note || `Order status changed to ${status}`,
    });

    await order.save();

    // Emit status update via Socket.IO

    const io = req.app.get("io");

    if (io) {
      // Emit to user's room

      io.to(`user_${order.userId}`).emit("order_status_updated", {
        orderId: id,

        status,

        timestamp: new Date(),
      });

      // Also emit to order-specific room

      io.to(`order_${order._id}`).emit("order:updated", {
        orderId: order._id,

        status: order.status,

        paymentStatus: order.paymentStatus,

        message: `Order status updated to ${status}`,

        timestamp: new Date(),
      });
    }

    res.json({
      success: true,

      data: order,
    });
  } catch (error: any) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to update order",

      message: error.message,
    });
  }
};

// Simulate payment webhook (for testing)

const simulatePayment = async (req: any, res: any) => {
  try {
    const { orderId } = req.params;
    const { success = true } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ✨ Simulate webhook delay (like Paystack would)
    setTimeout(async () => {
      try {
        if (success) {
          order.paymentStatus = "completed";
          order.status = "processing";
          order.paidAt = new Date();
          order.statusHistory.push({
            status: "processing",
            timestamp: new Date(),
            note: "Payment confirmed (simulated)",
          });
          await order.save();

          // ✨ EMIT SOCKET.IO EVENT (Real-time update!)
          const io = req.app.get("io");
          io.to(`order_${order._id}`).emit("order:updated", {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            message: "Payment confirmed!",
            timestamp: new Date(),
          });

          console.log(`✅ Payment simulated for order ${order._id}`);
        } else {
          // Simulate failure
          order.paymentStatus = "failed";
          order.statusHistory.push({
            status: "pending",
            timestamp: new Date(),
            note: "Payment failed (simulated)",
          });
          await order.save();

          const io = req.app.get("io");
          io.to(`order_${order._id}`).emit("order:updated", {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            message: "Payment failed",
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Webhook simulation error:", error);
      }
    }, 2000); // 2-second delay

    // Respond immediately (like real webhook)
    res.json({ success: true, message: "Payment processing..." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userId = req.user?.userId;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,

        error: "Order not found",
      });
    }

    // Can only cancel pending or processing orders

    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({
        success: false,

        error: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Update order status

    order.status = "cancelled";

    order.statusHistory.push({
      status: "cancelled",

      timestamp: new Date(),

      note: "Order cancelled by user",
    });

    await order.save();

    // Restore product inventory

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          inventory: item.quantity,

          "stats.purchases": -1,
        },
      });
    }

    // Emit cancellation event

    const io = req.app.get("io");

    if (io) {
      io.to(`order_${order._id}`).emit("order:updated", {
        orderId: order._id,

        status: order.status,

        message: "Order cancelled",

        timestamp: new Date(),
      });
    }

    res.json({
      success: true,

      data: order,

      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    console.error("Cancel order error:", error);

    res.status(500).json({
      success: false,

      error: "Failed to cancel order",

      message: error.message,
    });
  }
};

export const orderController = {
  createOrder,

  getOrders,

  getMyOrders,

  getOrderById,

  updateOrderStatus,

  simulatePayment,

  cancelOrder,
};
