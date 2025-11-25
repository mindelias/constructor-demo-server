import { Router, Response } from "express";
import { authMiddleware } from "@/middleware/auth";
import { orderController } from "@/controllers/orderController";
import { AuthRequest } from "@/types";
import { body } from "express-validator";

const router = Router();
// Get all orders for current user

const validateOrder = [
  body("items").isArray({ min: 1 }).withMessage("Items must be a non-empty array"),
  body("items.*.productId").notEmpty().withMessage("Product ID is required"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("shippingAddress.street").notEmpty().trim().withMessage("Street address is required"),
  body("shippingAddress.city").notEmpty().trim().withMessage("City is required"),
  body("shippingAddress.state").notEmpty().trim().withMessage("State is required"),
  body("shippingAddress.zipCode").notEmpty().trim().withMessage("Zip code is required"),
  body("shippingAddress.country").notEmpty().trim().withMessage("Country is required"),
];

router.get(
  "/",

  authMiddleware,

  orderController.getOrders
);

// Create order

router.post(
  "/",

  authMiddleware,

  validateOrder,

  orderController.createOrder
);

// Get paginated orders

router.get(
  "/my-orders",

  authMiddleware,

  orderController.getMyOrders
);

// Get single order by ID

router.get(
  "/:id",

  authMiddleware,

  orderController.getOrderById
);

// Update order status

router.patch(
  "/:id/status",

  authMiddleware,

  orderController.updateOrderStatus
);

// Simulate payment (for testing)

router.patch(
  "/:id/payment",

  authMiddleware,

  orderController.simulatePayment
);

// Cancel order

router.patch(
  "/:id/cancel",

  authMiddleware,

  orderController.cancelOrder
);

export default router;
