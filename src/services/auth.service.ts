import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sign } from 'hono/jwt';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { emailService } from './email.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors';

class AuthService {
  async register(data: RegisterInput) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
      emailVerificationToken: verificationToken
    });

    // Fire-and-forget the email verification in the background, logging any SMTP errors
    emailService.sendVerificationEmail(user.email, verificationToken).catch(err => {
      console.error('[AuthService] SMTP verification email failed to send:', err);
    });

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(data: LoginInput) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError(
        'Account temporarily locked due to multiple failed login attempts. Try again later.'
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        // Lock for 15 minutes
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await userRepository.update(user.id, updateData);
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedError('Please verify your email before logging in');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await userRepository.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null
      });
    }

    const token = await sign(
      { 
        sub: user.id, 
        tokenVersion: user.tokenVersion,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 
      },
      env.JWT_SECRET,
      'HS256'
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async revokeAllSessions(userId: string) {
    const user = await userRepository.findById(userId);
    if (user) {
      await userRepository.update(userId, {
        tokenVersion: user.tokenVersion + 1
      });
    }
  }

  async verifyEmail(token: string) {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null
    });

    return true;
  }

  async updateProfile(userId: string, data: any) {
    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing.id !== userId) {
        throw new ConflictError('Username already taken');
      }
    }

    const updateData = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    return await userRepository.update(userId, updateData);
  }
}

export const authService = new AuthService();
