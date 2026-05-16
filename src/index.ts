import { serve } from '@hono/node-server';
import app from './app/app';
import { env } from './config/env';

const port = env.PORT;

console.log(`Starting server on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port
  },
  info => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
  }
);
