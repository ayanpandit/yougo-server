import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CORS_ALLOW_CREDENTIALS: z.coerce.boolean().default(true),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  MAGIC_LINK_FROM_EMAIL: z.string().email(),
});

export const env = envSchema.parse(process.env);

if (env.CORS_ALLOW_CREDENTIALS && env.CORS_ORIGIN.trim() === "*") {
  throw new Error("CORS_ORIGIN cannot be '*' when CORS_ALLOW_CREDENTIALS=true");
}

export const corsOrigins =
  env.CORS_ORIGIN === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

export const corsOptions = {
  origin: corsOrigins,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: env.CORS_ALLOW_CREDENTIALS,
};
