import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

function getTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (transporter) {
    return transporter;
  }

  if (process.env.DEBUG_SMTP === 'true') {
    console.log('[SMTP-DEBUG] env presence', {
      SMTP_HOST: Boolean(SMTP_HOST),
      SMTP_PORT: Boolean(SMTP_PORT),
      SMTP_SECURE: Boolean(SMTP_SECURE),
      SMTP_USER: Boolean(SMTP_USER),
      SMTP_PASS: Boolean(SMTP_PASS),
    });
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendSignupOtpEmail(email, otpCode) {
  const { SMTP_FROM, SMTP_USER } = process.env;
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn(
      `[OTP-DEV] SMTP not configured. OTP for ${email}: ${otpCode}`
    );
    return;
  }

  await mailTransporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'Your Connectly verification code',
    text: `Your verification code is ${otpCode}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">Verify your Connectly account</h2>
        <p style="margin-top: 0;">Use this one-time code to complete your signup:</p>
        <p style="font-size: 28px; letter-spacing: 4px; font-weight: bold; margin: 16px 0;">${otpCode}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
