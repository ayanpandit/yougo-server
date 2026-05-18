import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).max(100)
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1)
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().min(1)
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(50).optional().nullable(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    bio: z.string().max(150).optional().nullable(),
    gender: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    travelStyle: z.string().optional().nullable(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    image: z.string().url().optional().nullable()
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.string().email()
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(100)
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

