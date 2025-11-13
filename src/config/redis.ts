import Redis from 'ioredis';

let redisClient: Redis | null = null;

const connectRedis = async (): Promise<void> => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.log('Redis: Max retries reached');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000); // Exponential backoff
      }
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
    
    redisClient.on('error', (err: Error) => {
      console.error('❌ Redis error:', err);
    });
    
    redisClient.on('ready', () => {
      console.log('📍 Redis ready to accept commands');
    });
    
    // Test connection
    await redisClient.ping();
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // Don't throw - app can work without cache
    redisClient = null;
  }
};

const getRedisClient = (): Redis | null => redisClient;

export { connectRedis, getRedisClient };