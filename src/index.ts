import { serve } from '@hono/node-server';
import app from './app/app';
import { env } from './config/env';
import { initSocketGateway } from './gateway/socket.gateway';

const port = env.PORT;

console.log(`Starting server on port ${port}...`);

const server = serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
  },
  info => {
    console.log(`🚀 Server is running on http://0.0.0.0:${info.port}`);
  }
);

initSocketGateway(server);

