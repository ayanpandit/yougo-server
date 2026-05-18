import { Hono } from 'hono';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

const authRoutes = new Hono();

authRoutes.post('/register', authRateLimiter, c => authController.register(c));
authRoutes.post('/login', authRateLimiter, c => authController.login(c));
authRoutes.post('/logout', c => authController.logout(c));
authRoutes.get('/verify-email', c => authController.verifyEmail(c));
authRoutes.post('/forgot-password', authRateLimiter, c => authController.forgotPassword(c));
authRoutes.post('/reset-password', authRateLimiter, c => authController.resetPassword(c));

// Protected routes
authRoutes.get('/me', requireAuth, c => authController.me(c));
authRoutes.put('/profile', requireAuth, c => authController.updateProfile(c));
authRoutes.post('/profile/image', requireAuth, c => authController.uploadProfileImage(c));

export default authRoutes;
