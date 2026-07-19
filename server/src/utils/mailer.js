import nodemailer from 'nodemailer';

/**
 * Transmits a premium HTML verification message to the student
 */
export const sendOTPEmail = async (email, name, otp) => {
  // Initialize transporter inside the function so environment variables are guaranteed to be loaded
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Note: Nodemailer looks for 'pass', not 'password'
    },
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #1E3A8A; padding: 32px; text-align: center; }
        .header h1 { color: #FFFFFF; margin: 0; font-size: 26px; tracking-wide: 1px; }
        .content { padding: 40px; text-align: left; line-height: 1.6; color: #111827; }
        .greeting { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #1E3A8A; }
        .otp-box { background-color: #F3F4F6; border: 2px dashed #0891B2; border-radius: 8px; padding: 20px; text-align: center; margin: 28px 0; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #0891B2; }
        .footer { background-color: #F9FAFB; padding: 24px; text-align: center; font-size: 12px; color: #4B5563; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>AI Learning Platform</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name},</div>
          <p>Welcome to your workspace. To finalize your registration and activate your interactive student profile, please enter the cryptographic verification token code displayed below:</p>
          <div class="otp-box">${otp}</div>
          <p>This verification token is confidential and will automatically expire in 2 minutes. If you did not initiate this registration request, you can safely disregard this email.</p>
        </div>
        <div class="footer">
          &copy; 2026 AI Learning Platform. Built to elite software engineering standards.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"AI Learning Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${otp} is your verification code`,
    html: htmlTemplate,
  });
};