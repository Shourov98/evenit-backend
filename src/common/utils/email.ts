import { Resend } from 'resend';
import { env } from '../../config/env';

const resend = new Resend(env.RESEND_API_KEY || undefined);

export type OtpDeliveryMode = 'email' | 'console';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (payload: { to: string; subject: string; html: string }): Promise<void> => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: payload.html
  });

  if (result.error) {
    throw new Error(`Resend email send failed: ${result.error.message}`);
  }
};

export const logOtpToConsole = (payload: {
  to: string;
  otp: string;
  subject: string;
  purposeLabel: string;
}): void => {
  console.info('\n[OTP FALLBACK]');
  console.info(`Delivery: terminal`);
  console.info(`Email: ${payload.to}`);
  console.info(`Purpose: ${payload.purposeLabel}`);
  console.info(`Subject: ${payload.subject}`);
  console.info(`OTP: ${payload.otp}\n`);
};

export const buildOtpEmailHtml = (otp: string, purposeLabel: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>${purposeLabel} OTP</h2>
      <p>Your one-time password is:</p>
      <p style="font-size: 26px; font-weight: 700; letter-spacing: 3px;">${otp}</p>
      <p>This OTP will expire soon. Do not share it with anyone.</p>
    </div>
  `;
};

export const sendOtpEmail = async (payload: {
  to: string;
  otp: string;
  subject: string;
  purposeLabel: string;
}): Promise<OtpDeliveryMode> => {
  const emailPayload: EmailPayload = {
    to: payload.to,
    subject: payload.subject,
    html: buildOtpEmailHtml(payload.otp, payload.purposeLabel)
  };

  try {
    await sendEmail(emailPayload);
    return 'email';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email delivery error';
    console.warn(`[OTP FALLBACK] Email delivery failed. Using terminal output instead. Reason: ${message}`);
    logOtpToConsole(payload);
    return 'console';
  }
};
