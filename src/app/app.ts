import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { csrf } from 'hono/csrf';
import { secureHeaders } from 'hono/secure-headers';
import authRoutes from '../routes/auth.routes';
import tripRoutes from '../routes/trip.routes';
import feedRoutes from '../routes/feed.routes';
import profileRoutes from '../routes/profile.routes';
import likeRoutes from '../routes/like.routes';
import { errorHandler, notFoundHandler } from '../middleware/error.middleware';
import { env } from '../config/env';

const app = new Hono();

// Global Middlewares
// Using '/*' wildcard pattern instead of '*' to ensure Hono intercepts nested routes and preflights (OPTIONS) correctly
app.use('/*', logger());
app.use('/*', secureHeaders());
app.use(
  '/*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(
  '/*',
  csrf({
    origin: env.FRONTEND_URL
  })
);

// Routes
app.route('/auth', authRoutes);
app.route('/api/v1/generate', tripRoutes);
app.route('/feed', feedRoutes);
app.route('/api/v1/feed', feedRoutes);
app.route('/profile', profileRoutes);
app.route('/api/v1/trips', likeRoutes);


// Health Check
app.get('/health', c => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Example route
app.get('/', c => {
  return c.text('Welcome to YouGO API');
});

// 404 Handler
app.notFound(notFoundHandler);

// Error Handler
app.onError(errorHandler);

export default app;
