import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { userRepository } from '../repositories/user.repository';

export const requireAuth = async (c: Context, next: Next) => {
  const token = getCookie(c, 'jwt');

  if (!token) {
    throw new UnauthorizedError('Not logged in');
  }

  try {
    const decoded = await verify(token, env.JWT_SECRET, 'HS256');
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      throw new UnauthorizedError('Invalid token payload');
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // Token Versioning: Industry Standard Revocation Check
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedError('Session expired or revoked. Please log in again.');
    }

    c.set('user', user);
    await next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
