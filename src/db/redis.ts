import Redis from 'ioredis';
import { env } from '../config/env';

let isConnected = false;

const redis = new Redis(env.REDIS_URL, {
  keyPrefix: 'server:',
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    // Reconnection retry backoff capped at 3 seconds
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('🔌 [Redis] Client is connecting...');
});

redis.on('ready', () => {
  isConnected = true;
  console.log('🚀 [Redis] Connection established successfully and cache layer is ready!');
});

redis.on('error', (err) => {
  isConnected = false;
  console.error('❌ [Redis] Client connection error:', err.message || err);
});

redis.on('close', () => {
  isConnected = false;
  console.warn('⚠️ [Redis] Client connection closed.');
});

// Start connection in the background to prevent blocking application bootstrap
redis.connect().catch((err) => {
  // Captured silently, reconnection strategy will pick up when Redis comes online
  console.error('❌ [Redis] Initial background connection failed:', err.message || err);
});

export { redis };
export const isRedisConnected = () => isConnected;
export const checkRedisHealth = async (): Promise<boolean> => {
  if (!isConnected) return false;
  try {
    const ping = await redis.ping();
    return ping === 'PONG';
  } catch {
    return false;
  }
};
