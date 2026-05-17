import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { registerSchema, loginSchema, verifyEmailSchema, updateProfileSchema } from '../validators/auth.validator';

export class AuthController {
  async register(c: Context) {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    const user = await authService.register(data);

    return c.json(
      {
        status: 'success',
        message: 'Registration successful. Please check your email to verify your account.',
        data: { user }
      },
      201
    );
  }

  async login(c: Context) {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const { user, token } = await authService.login(data);

    setCookie(c, 'jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return c.json({
      status: 'success',
      message: 'Logged in successfully',
      data: { user }
    });
  }

  async logout(c: Context) {
    const token = getCookie(c, 'jwt');
    if (token) {
      try {
        const decoded = await verify(token, env.JWT_SECRET, 'HS256');
        if (decoded && decoded.sub && typeof decoded.sub === 'string') {
          await authService.revokeAllSessions(decoded.sub);
        }
      } catch (e) {
        // Token invalid/expired, proceed to delete cookie
      }
    }
    
    deleteCookie(c, 'jwt', { path: '/' });
    return c.json({
      status: 'success',
      message: 'All sessions revoked and logged out successfully'
    });
  }

  async verifyEmail(c: Context) {
    const token = c.req.query('token');
    const data = verifyEmailSchema.parse({ token });

    await authService.verifyEmail(data.token);

    return c.json({
      status: 'success',
      message: 'Email verified successfully. You can now log in.'
    });
  }

  async me(c: Context) {
    const user = c.get('user');
    const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user;

    return c.json({
      status: 'success',
      data: { user: safeUser }
    });
  }

  async updateProfile(c: Context) {
    const user = c.get('user');
    const body = await c.req.json();
    const data = updateProfileSchema.parse(body);

    const updatedUser = await authService.updateProfile(user.id, data);
    const { passwordHash: _, emailVerificationToken: __, ...safeUser } = updatedUser;

    return c.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: safeUser }
    });
  }
}

export const authController = new AuthController();
