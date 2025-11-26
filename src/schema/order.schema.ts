import { IOrder } from "@/types";
import { Schema } from "mongoose";

export const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "cash_on_delivery", "simulated"],
      default: "simulated",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    paymentReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    paidAt: Date,

    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          note: String,
        },
      ],
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
