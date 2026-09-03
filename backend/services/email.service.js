import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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