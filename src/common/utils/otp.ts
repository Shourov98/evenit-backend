import crypto from 'crypto';
import { env } from '../../config/env';

const otpSecret = env.JWT_SECRET;

export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtpCode = (code: string): string => {
  return crypto.createHmac('sha256', otpSecret).update(code).digest('hex');
};
