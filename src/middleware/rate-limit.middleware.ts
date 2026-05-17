import { Context, Next } from 'hono';
import { TooManyRequestsError } from '../utils/errors';
import { env } from '../config/env';

// A simple in-memory store for rate limiting.
const requestCounts = new Map<string, { count: number; timestamp: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Relax limits in development so the developer is not blocked while testing
const MAX_REQUESTS = env.NODE_ENV === 'development' ? 100 : 5;

export const authRateLimiter = async (c: Context, next: Next) => {
  // Use IP address.
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';

  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return next();
  }

  // If outside the window, reset
  if (now - record.timestamp > WINDOW_MS) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return next();
  }

  // If inside window and exceeded max
  if (record.count >= MAX_REQUESTS) {
    throw new TooManyRequestsError();
  }

  record.count += 1;
  requestCounts.set(ip, record);

  await next();
};
