import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

class EmailDeliveryError extends Error {
  constructor(message, publicMessage = message) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.publicMessage = publicMessage;
  }
}

function getSignupEmailContent(otpCode) {
  return {
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
  };
}

function isProductionRuntime() {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RAILWAY_ENVIRONMENT)
  );
}

function canLogOtpToConsole() {
  return !isProductionRuntime() || process.env.ALLOW_CONSOLE_OTP === 'true';
}

async function sendWithResend(email, otpCode) {
  const { RESEND_API_KEY, RESEND_FROM, SMTP_FROM, SMTP_USER } = process.env;

  if (!RESEND_API_KEY) {
    return false;
  }

  const from = RESEND_FROM || SMTP_FROM || SMTP_USER || 'Connectly <onboarding@resend.dev>';
  if (!from) {
    throw new EmailDeliveryError(
      'RESEND_FROM or SMTP_FROM is required to send OTP email.',
      'Email sender is not configured.'
    );
  }

  const content = getSignupEmailContent(otpCode);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const isResendTestDomainBlocked =
      response.status === 403 &&
      from.includes('@resend.dev') &&
      errorBody.toLowerCase().includes('verify a domain');

    if (isResendTestDomainBlocked) {
      throw new EmailDeliveryError(
        `Resend email failed with status ${response.status}: ${errorBody}`,
        'Resend test sender can only email your Resend account address. Verify a domain in Resend and set RESEND_FROM to an address on that domain.'
      );
    }

    throw new EmailDeliveryError(
      `Resend email failed with status ${response.status}: ${errorBody}`,
      'Email provider rejected the verification email. Check the backend email provider settings.'
    );
  }

  return true;
}

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

  const port = Number(SMTP_PORT);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: String(SMTP_SECURE || port === 465).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

export async function sendSignupOtpEmail(email, otpCode) {
  const { SMTP_FROM, SMTP_USER } = process.env;
  const sentWithResend = await sendWithResend(email, otpCode);

  if (sentWithResend) {
    return;
  }

  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    if (!canLogOtpToConsole()) {
      throw new Error('Signup email delivery is not configured.');
    }

    console.warn(
      `[OTP-DEV] SMTP not configured. OTP for ${email}: ${otpCode}`
    );
    return;
  }

  const content = getSignupEmailContent(otpCode);
  await mailTransporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}
