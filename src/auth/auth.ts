import { randomUUID } from "node:crypto";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";

import { env } from "@/config";
import { prisma } from "@/db";
import { sendMagicLinkEmail } from "@/services/email.service";

const generateUsername = (email: string | null | undefined) => {
  const base = (email ?? "user").split("@")[0] ?? "user";
  const suffix = randomUUID().slice(0, 6);
  return `${base}-${suffix}`.toLowerCase();
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url });
      },
    }),
  ],
  user: {
    additionalFields: {
      username: { type: "string", required: false },
      bio: { type: "string", required: false },
      gender: { type: "string", required: false },
      travelStyle: { type: "string", required: false },
      country: { type: "string", required: false },
      isVerified: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.username) {
            return { data: { ...user, username: generateUsername(user.email) } };
          }
          return { data: user };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
