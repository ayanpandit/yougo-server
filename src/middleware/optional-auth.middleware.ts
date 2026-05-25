import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';

export const optionalAuth = async (c: Context, next: Next) => {
  let token = getCookie(c, 'jwt');

  // Fallback to Authorization Header
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = await verify(token, env.JWT_SECRET, 'HS256');
    if (decoded.sub && typeof decoded.sub === 'string') {
      const user = await userRepository.findById(decoded.sub);
      
      if (user && decoded.tokenVersion === user.tokenVersion) {
        c.set('user', user);
      }
    }
  } catch (error) {
    // Silently fail for optional auth (token might be expired, etc.)
  }

  await next();
};
