import nodemailer from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Only initialize SMTP if there's no API Token (or for fallback)
    if (!process.env.MAILTRAP_API_TOKEN) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const subject = 'Verify your YouGO Account';
    const html = `
      <h1>Welcome to YouGO!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // 1. If we have a Mailtrap API Token, use the high-performance HTTP API (bypasses Railway SMTP blocks!)
    const apiToken = process.env.MAILTRAP_API_TOKEN;
    if (apiToken) {
      try {
        const inboxId = process.env.MAILTRAP_INBOX_ID;
        const url = inboxId 
          ? `https://sandbox.api.mailtrap.io/api/send/${inboxId}`
          : 'https://send.api.mailtrap.io/api/send';

        console.log(`[EmailService] Attempting to send email via Mailtrap HTTP API to URL: ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          },
          body: JSON.stringify({
            from: { email: env.SMTP_FROM || 'noreply@yougo.com', name: 'YouGO' },
            to: [{ email: to }],
            subject,
            html
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Mailtrap API responded with ${response.status}: ${errText}`);
        }
        console.log('[EmailService] Email sent successfully via Mailtrap HTTP API!');
        return; // Success!
      } catch (apiError) {
        console.error('[EmailService] Mailtrap HTTP API failed, falling back to SMTP:', apiError);
      }
    }

    // 2. Fallback to standard SMTP (useful for local development)
    const activeTransporter = this.transporter || nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: env.SMTP_FROM,
      to,
      subject,
      html
    };
    await activeTransporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
