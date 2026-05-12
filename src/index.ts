import { serve } from "@hono/node-server";
import { createApp } from "@/app/app";
import { env } from "@/config";
import { prisma } from "@/db";

const app = createApp();

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down...`);
  server.close?.();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

console.log(`API running on port ${env.PORT}`);
