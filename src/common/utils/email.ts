import { Resend } from 'resend';
import { env } from '../../config/env';

const resend = new Resend(env.RESEND_API_KEY || undefined);

export const sendEmail = async (payload: { to: string; subject: string; html: string }): Promise<void> => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: payload.html
  });
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
