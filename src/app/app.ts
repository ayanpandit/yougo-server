import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use('*', cors());

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
app.notFound(c => {
  return c.json({ message: 'Not Found' }, 404);
});

// Error Handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ message: 'Internal Server Error' }, 500);
});

export default app;
