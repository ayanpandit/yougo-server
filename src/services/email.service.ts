import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

class EmailService {
  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Verify your YouGO Account',
      html: `
        <h1>Welcome to YouGO!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    if (error) {
      throw new Error(`[EmailService] Resend API error: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();
