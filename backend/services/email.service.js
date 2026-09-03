import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// SMTP is optional: callers fall back to in-app notifications when unset.
export const isSmtpConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port || 587,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      }
    });
  }
  return transporter;
};

export async function sendEmail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    return { skipped: true };
  }
  const info = await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject,
    html
  });
  return info;
}

export async function sendCredentialsEmail({ to, name, email, password }) {
  const subject = 'CampusFlow - Account Credentials';
  const html = `
    <h2>Welcome ${name}!</h2>
    <p>Your CampusFlow account has been created.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>Please change your password after first login.</p>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const subject = 'CampusFlow - Password Reset';
  const html = `
    <h2>Hi ${name || 'there'},</h2>
    <p>You requested a password reset for your CampusFlow account.</p>
    <p>Your reset token is: <strong>${token}</strong></p>
    <p>It is valid for 10 minutes. If you did not request a reset, you can safely ignore this email.</p>
  `;
  return sendEmail({ to, subject, html });
}
