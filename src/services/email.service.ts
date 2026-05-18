import { env } from '../config/env';

class EmailService {
  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    const payload = {
      sender: {
        name: 'YouGO',
        email: env.BREVO_SENDER_EMAIL
      },
      to: [
        {
          email: to
        }
      ],
      subject: 'Verify your YouGO Account',
      htmlContent: `
        <h1>Welcome to YouGO!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': env.BREVO_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send email via Brevo:', errorData);
        throw new Error('Failed to send verification email');
      }

      console.log(`Verification email successfully sent to ${to} via Brevo`);
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
