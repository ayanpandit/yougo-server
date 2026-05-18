import { env } from '../config/env';

class EmailService {
  private async sendEmail(to: string, subject: string, htmlContent: string) {
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
      subject,
      htmlContent
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
        throw new Error('Failed to send email');
      }

      console.log(`Email successfully sent to ${to} with subject "${subject}" via Brevo`);
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const htmlContent = `
      <h1>Welcome to YouGO!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    await this.sendEmail(to, 'Verify your YouGO Account', htmlContent);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const htmlContent = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your YouGO account.</p>
      <p>Please click the link below to set a new password. This link is valid for 1 hour:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;
    await this.sendEmail(to, 'Reset your YouGO Password', htmlContent);
  }

  async sendPasswordResetConfirmationEmail(to: string) {
    const htmlContent = `
      <h1>Password Reset Successful</h1>
      <p>This is a confirmation that the password for your YouGO account has been successfully updated.</p>
      <p>If you did not perform this action, please contact support immediately.</p>
    `;
    await this.sendEmail(to, 'Your YouGO password has been changed', htmlContent);
  }
}

export const emailService = new EmailService();
