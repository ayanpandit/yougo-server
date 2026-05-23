import { z } from 'zod';
import { config } from 'dotenv';
import path from 'path';

// Load .env file
config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  FRONTEND_URL: z.string().url(),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  BRAIN_SERVICE_URL: z.string().url().default('http://localhost:8001')
});

// Pre-process process.env to defensively strip any surrounding quotes automatically applied by Railway/cloud hosting
const cleanProcessEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => {
    if (typeof value === 'string') {
      // Remove leading and trailing double or single quotes
      const cleaned = value.replace(/^["']|["']$/g, '');
      return [key, cleaned];
    }
    return [key, value];
  })
);

const _env = envSchema.safeParse(cleanProcessEnv);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
