import Redis from 'ioredis';

// Optional fallback to in-memory cache if Redis isn't configured
class InMemoryCache {
  private store = new Map<string, { value: string, expiresAt: number }>();

  async set(key: string, value: string, ...args: any[]) {
    let expiresAt = Infinity;
    if (args[0] === 'EX' && typeof args[1] === 'number') {
      expiresAt = Date.now() + args[1] * 1000;
    } else if (args[0] && typeof args[0] === 'object' && args[0].EX) {
      expiresAt = Date.now() + args[0].EX * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
}

// Initialize Redis Client
const redisUrl = process.env.REDIS_URL || '';
export const redisClient = redisUrl ? new Redis(redisUrl) : new InMemoryCache();

export async function setCache(key: string, data: any, ttlSeconds: number = 300) {
  try {
    const serialized = JSON.stringify(data);
    await redisClient.set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (error) {
    console.error('Redis Set Error:', error);
    return false;
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached) as T;
    return null;
  } catch (error) {
    console.error('Redis Get Error:', error);
    return null;
  }
}
