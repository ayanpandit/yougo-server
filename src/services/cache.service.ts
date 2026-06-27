import { redis, isRedisConnected } from '../db/redis';

export class CacheService {
  /**
   * Retrieve and parse a JSON-deserialized object from Redis.
   * Gracefully falls back to returning null if Redis is offline.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisConnected()) {
      return null;
    }
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err: any) {
      console.error(`⚠️ [CacheService] Error reading key "${key}":`, err.message || err);
      return null;
    }
  }

  /**
   * Serialize and store an object in Redis with an optional expiration time in seconds (TTL).
   * Gracefully degrades (fails silently) if Redis is offline.
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redis.set(key, serialized);
      }
    } catch (err: any) {
      console.error(`⚠️ [CacheService] Error writing key "${key}":`, err.message || err);
    }
  }

  /**
   * Delete a key from the cache.
   */
  async del(key: string): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }
    try {
      await redis.del(key);
    } catch (err: any) {
      console.error(`⚠️ [CacheService] Error deleting key "${key}":`, err.message || err);
    }
  }

  /**
   * Incremental pattern-matching invalidation utilizing Redis SCAN.
   * Safe for production use; prevents blocking the Redis CPU.
   */
  async invalidatePrefix(prefix: string): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }
    try {
      const stream = redis.scanStream({
        match: `${prefix}*`,
        count: 100, // Paginate scan cursor in batches of 100 keys
      });

      return new Promise((resolve) => {
        stream.on('data', async (keys: string[]) => {
          if (keys.length > 0) {
            stream.pause(); // Pause streaming key discovery during bulk deletion
            try {
              await redis.del(...keys);
            } catch (err: any) {
              console.error(`⚠️ [CacheService] Failed to delete matching keys:`, err.message || err);
            } finally {
              stream.resume(); // Resume scan cursor stream
            }
          }
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (err: any) => {
          console.error(`⚠️ [CacheService] Invalidation stream error for prefix "${prefix}":`, err.message || err);
          resolve(); // Resolve to let caller continue execution
        });
      });
    } catch (err: any) {
      console.error(`⚠️ [CacheService] Prefix invalidation failed for "${prefix}":`, err.message || err);
    }
  }
}

export const cacheService = new CacheService();
