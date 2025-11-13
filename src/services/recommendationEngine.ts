import Product from '@/models/Product';
import User from '@/models/User';
import { IProduct, IUser, RecommendationRequest, RecommendationResponse } from '@/types';
import { getRedisClient } from '@/config/redis';

class RecommendationEngine {
  /**
   * Generate personalized recommendations using hybrid approach
   */
  async generate(request: RecommendationRequest): Promise<RecommendationResponse[]> {
    const { user, limit, category, strategy } = request;
    
    let recommendations: RecommendationResponse[] = [];

    switch (strategy) {
      case 'collaborative':
        recommendations = await this.collaborativeFiltering(user, limit, category);
        break;
      case 'content-based':
        recommendations = await this.contentBasedFiltering(user, limit, category);
        break;
      case 'hybrid':
      default:
        recommendations = await this.hybridApproach(user, limit, category);
        break;
    }

    return recommendations;
  }

  /**
   * Collaborative filtering based on similar users
   */
  private async collaborativeFiltering(
    user: IUser, 
    limit: number, 
    category?: string | null
  ): Promise<RecommendationResponse[]> {
    try {
      // Find users with similar purchase history
      const similarUsers = await User.find({
        _id: { $ne: user._id },
        'purchaseHistory.orderId': { 
          $in: user.purchaseHistory.map(p => p.orderId) 
        }
      }).limit(20);

      // Get products purchased by similar users
      const productIds = new Set<string>();
      for (const similarUser of similarUsers) {
        for (const view of similarUser.viewHistory) {
          productIds.add(view.productId.toString());
        }
      }

      // Filter out products user has already seen
      const seenProducts = new Set(
        user.viewHistory.map(v => v.productId.toString())
      );
      const recommendedIds = Array.from(productIds)
        .filter(id => !seenProducts.has(id))
        .slice(0, limit);

      // Fetch and score products
      const products = await Product.find({
        _id: { $in: recommendedIds },
        ...(category && { category })
      }).lean();

      return products.map(product => ({
        productId: product._id.toString(),
        score: this.calculateScore(product as unknown as IProduct),
        reason: 'Users like you also viewed this',
        product: product as unknown as IProduct
      }));

    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Content-based filtering based on user preferences and history
   */
  private async contentBasedFiltering(
    user: IUser,
    limit: number,
    category?: string | null
  ): Promise<RecommendationResponse[]> {
    try {
      // Get user's preferred categories from history
      const viewedProducts = await Product.find({
        _id: { $in: user.viewHistory.map(v => v.productId) }
      }).select('category tags features price');

      // Build user preference profile
      const categoryCount: Record<string, number> = {};
      const tagCount: Record<string, number> = {};
      let avgPrice = 0;

      viewedProducts.forEach(product => {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
        product.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
        avgPrice += product.price;
      });

      avgPrice = avgPrice / viewedProducts.length || 0;

      // Find similar products
      const query: any = {
        _id: { $nin: user.viewHistory.map(v => v.productId) }
      };

      if (category) {
        query.category = category;
      } else if (Object.keys(categoryCount).length > 0) {
        query.category = { $in: Object.keys(categoryCount) };
      }

      if (Object.keys(tagCount).length > 0) {
        query.tags = { $in: Object.keys(tagCount).slice(0, 5) };
      }

      // Price range around user's average
      if (avgPrice > 0) {
        query.price = {
          $gte: avgPrice * 0.5,
          $lte: avgPrice * 1.5
        };
      }

      const products = await Product.find(query)
        .sort('-stats.rating')
        .limit(limit)
        .lean();
  
      return products.map(product => ({
        productId: product._id.toString(),
        score: this.calculateScore(product as unknown as IProduct),
        reason: 'Based on your viewing history',
        product: product as unknown as IProduct
      }));

    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }

  /**
   * Hybrid approach combining multiple strategies
   */
  private async hybridApproach(
    user: IUser,
    limit: number,
    category?: string | null
  ): Promise<RecommendationResponse[]> {
    try {
      // Get recommendations from both approaches
      const [collaborative, contentBased, trending] = await Promise.all([
        this.collaborativeFiltering(user, Math.floor(limit * 0.4), category),
        this.contentBasedFiltering(user, Math.floor(limit * 0.4), category),
        this.getTrendingProducts(Math.floor(limit * 0.2), category)
      ]);

      // Combine and deduplicate
      const seen = new Set<string>();
      const combined: RecommendationResponse[] = [];

      [...collaborative, ...contentBased, ...trending].forEach(rec => {
        if (!seen.has(rec.productId)) {
          seen.add(rec.productId);
          combined.push(rec);
        }
      });

      // Sort by score and return top N
      return combined
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Hybrid approach error:', error);
      // Fallback to trending
      return this.getTrendingProducts(limit, category);
    }
  }

  /**
   * Get trending products as fallback
   */
  private async getTrendingProducts(
    limit: number,
    category?: string | null
  ): Promise<RecommendationResponse[]> {
    const query = category ? { category } : {};
    
    const products = await Product.find(query)
      .sort({ 'stats.views': -1, 'stats.rating': -1 })
      .limit(limit)
      .lean();

    return products.map(product => ({
      productId: product._id.toString(),
      score: this.calculateScore(product as unknown as IProduct),
      reason: 'Trending now',
      product: product as unknown as IProduct
    }));
  }

  /**
   * Calculate recommendation score for a product
   */
  private calculateScore(product: IProduct): number {
    const viewScore = Math.min(product.stats.views / 1000, 1) * 0.2;
    const purchaseScore = Math.min(product.stats.purchases / 100, 1) * 0.3;
    const ratingScore = (product.stats.rating / 5) * 0.3;
    const reviewScore = Math.min(product.stats.reviewCount / 50, 1) * 0.2;

    return viewScore + purchaseScore + ratingScore + reviewScore;
  }

  /**
   * Update user-product affinity scores (for real-time learning)
   */
  async updateAffinity(
    userId: string,
    productId: string,
    action: 'view' | 'click' | 'purchase',
    duration?: number
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const key = `affinity:${userId}:${productId}`;
    const score = this.getActionScore(action, duration);

    try {
      const currentScore = await redis.get(key);
      const newScore = (parseFloat(currentScore || '0') + score).toFixed(2);
      await redis.setex(key, 86400 * 7, newScore); // Expire in 7 days
    } catch (error) {
      console.error('Failed to update affinity:', error);
    }
  }

  /**
   * Get score for different user actions
   */
  private getActionScore(action: string, duration?: number): number {
    switch (action) {
      case 'view':
        // Score based on time spent
        if (duration) {
          if (duration < 5) return 0.1;
          if (duration < 30) return 0.3;
          if (duration < 60) return 0.5;
          return 0.7;
        }
        return 0.2;
      case 'click':
        return 0.5;
      case 'purchase':
        return 1.0;
      default:
        return 0;
    }
  }
}

export default new RecommendationEngine();