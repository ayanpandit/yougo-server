import nodemailer from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // We drop the "service: 'gmail'" shortcut to gain full control over the socket options.
    // By explicitly setting host, port, and most importantly 'family: 4', we forcefully 
    // instruct Node.js to connect to Gmail's IPv4 address.
    // This perfectly resolves the ENETUNREACH IPv6 bug on cloud containers (like Railway).
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASS
      },
      // Force IPv4
      family: 4
    } as any);
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
