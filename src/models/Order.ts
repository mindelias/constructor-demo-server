import { orderSchema } from "@/schema/order.schema";
import { IOrder } from "@/types";
import mongoose from "mongoose";



// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.pre('save', function(next) {
  // Check if new document AND statusHistory is empty or undefined
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date(),
      note: 'Order placed',
    }];
  }
  next();
});

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
