import nodemailer from 'nodemailer';
import dns from 'dns';
import { env } from '../config/env';

// Force Node's DNS resolver to prefer IPv4 over IPv6.
// This prevents ENETUNREACH errors in dual-stack cloud containers (like Railway/Render)
// that lack IPv6 outbound routing.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASS
      }
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"YouGO" <${env.GMAIL_USER}>`,
      to,
      subject: 'Verify your YouGO Account',
      html: `
        <h1>Welcome to YouGO!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
