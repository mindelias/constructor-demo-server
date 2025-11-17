import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/types';

const productSchema = new Schema<IProduct>({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: { 
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: { 
    type: String, 
    required: [true, 'Product category is required'],
    enum: {
      values: ['electronics', 'clothing', 'books', 'home', 'sports', 'accessories', 'toys', 'food', 'health', 'beauty', 'other'],
      message: '{VALUE} is not a valid category'
    }
  },
  tags: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images: string[]) {
        return images.length <= 10;
      },
      message: 'Cannot have more than 10 images'
    }
  },
  inventory: { 
    type: Number, 
    default: 0,
    min: [0, 'Inventory cannot be negative']
  },
  
  // Features for recommendation system
  features: {
    brand: { 
      type: String,
      trim: true
    },
    color: String,
    size: [String],
    material: String
  },
  
  // Analytics and statistics
  stats: {
    views: { 
      type: Number, 
      default: 0,
      min: 0
    },
    purchases: { 
      type: Number, 
      default: 0,
      min: 0
    },
    rating: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: { 
      type: Number, 
      default: 0,
      min: 0
    }
  },
  
  // ML features - vector representation for similarity
  embedding: {
    type: [Number],
    default: undefined,
    select: false // Don't include by default in queries
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'stats.rating': -1 });
productSchema.index({ 'stats.views': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.inventory > 0;
});

// Virtual for popularity score (for recommendations)
productSchema.virtual('popularityScore').get(function() {
  const viewWeight = 0.3;
  const purchaseWeight = 0.5;
  const ratingWeight = 0.2;
  
  const normalizedViews = Math.min(this.stats.views / 1000, 1);
  const normalizedPurchases = Math.min(this.stats.purchases / 100, 1);
  const normalizedRating = this.stats.rating / 5;
  
  return (
    normalizedViews * viewWeight +
    normalizedPurchases * purchaseWeight +
    normalizedRating * ratingWeight
  );
});

// Instance methods
productSchema.methods.incrementView = async function(): Promise<void> {
  this.stats.views += 1;
  await this.save();
};

productSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  const totalRating = this.stats.rating * this.stats.reviewCount + newRating;
  this.stats.reviewCount += 1;
  this.stats.rating = totalRating / this.stats.reviewCount;
  await this.save();
};

// Static methods for common queries
productSchema.statics.findByCategory = function(category: string) {
  return this.find({ category }).sort('-stats.rating');
};

productSchema.statics.findTrending = function(limit: number = 10) {
  return this.find()
    .sort({ 'stats.views': -1, 'stats.purchases': -1 })
    .limit(limit);
};

productSchema.statics.findSimilar = async function(productId: string, limit: number = 5) {
  const product = await this.findById(productId);
  if (!product) return [];
  
  return this.find({
    category: product.category,
    _id: { $ne: productId }
  })
  .sort('-stats.rating')
  .limit(limit);
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Generate tags from name and description if not provided
  if (this.isNew && this.tags.length === 0) {
    const words = `${this.name} ${this.description || ''}`.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    this.tags = [...new Set(words.filter(word => word.length > 2 && !commonWords.has(word)))].slice(0, 10);
  }
  next();
});

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;