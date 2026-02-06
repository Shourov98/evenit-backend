import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';
import { buildOtpEmailHtml, sendEmail } from '../../common/utils/email';
import { signJwt } from '../../common/utils/jwt';
import { generateOtpCode, hashOtpCode } from '../../common/utils/otp';
import { AuthOtpModel, OtpPurpose } from './auth-otp.model';
import { IUser, UserModel, UserRole } from './auth.model';

const otpExpiryMs = Number(env.OTP_EXPIRY_MINUTES) * 60 * 1000;
const otpCooldownMs = Number(env.OTP_RESEND_COOLDOWN_SECONDS) * 1000;

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'customer' | 'service_provider' | 'venue_provider'>;
  serviceCategories: string[];
}

const sendOtpForPurpose = async (
  user: IUser,
  purpose: OtpPurpose,
  subject: string,
  purposeLabel: string
): Promise<void> => {
  const now = new Date();
  const existing = await AuthOtpModel.findOne({
    userId: user._id,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });

  if (existing && existing.resendAvailableAt.getTime() > now.getTime()) {
    const waitSeconds = Math.ceil((existing.resendAvailableAt.getTime() - now.getTime()) / 1000);
    throw new AppError(429, `Please wait ${waitSeconds} seconds before requesting another OTP`);
  }

  const otp = generateOtpCode();
  const codeHash = hashOtpCode(otp);
  const expiresAt = new Date(Date.now() + otpExpiryMs);
  const resendAvailableAt = new Date(Date.now() + otpCooldownMs);

  await AuthOtpModel.updateMany(
    { userId: user._id, purpose, consumedAt: null },
    { $set: { consumedAt: now } }
  );

  await AuthOtpModel.create({
    userId: user._id,
    email: user.email,
    purpose,
    codeHash,
    expiresAt,
    resendAvailableAt
  });

  await sendEmail({
    to: user.email,
    subject,
    html: buildOtpEmailHtml(otp, purposeLabel)
  });
};

const verifyOtp = async (payload: {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}): Promise<IUser> => {
  const user = await UserModel.findOne({ email: payload.email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const record = await AuthOtpModel.findOne({
    userId: user._id,
    purpose: payload.purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new AppError(400, 'OTP is invalid or expired');
  }

  const incomingHash = hashOtpCode(payload.otp);
  if (incomingHash !== record.codeHash) {
    throw new AppError(400, 'OTP is invalid or expired');
  }

  record.consumedAt = new Date();
  await record.save();

  return user;
};

export class AuthService {
  static async register(payload: RegisterPayload) {
    const existing = await UserModel.findOne({ email: payload.email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'Email already in use');
    }

    const user = await UserModel.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      serviceCategories: payload.role === 'service_provider' ? payload.serviceCategories : []
    });

    await sendOtpForPurpose(user, 'email_verification', 'Verify your email', 'Email Verification');

    return { user };
  }

  static async resendVerificationOtp(payload: { email: string }) {
    const user = await UserModel.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.isEmailVerified) {
      throw new AppError(400, 'Email is already verified');
    }

    await sendOtpForPurpose(user, 'email_verification', 'Verify your email', 'Email Verification');
  }

  static async verifyEmailOtp(payload: { email: string; otp: string }) {
    const user = await verifyOtp({ ...payload, purpose: 'email_verification' });
    user.isEmailVerified = true;
    await user.save();

    const token = signJwt({ userId: String(user._id), role: user.role });

    return { token, user };
  }

  static async login(payload: { email: string; password: string }) {
    const user = await UserModel.findOne({ email: payload.email.toLowerCase() }).select('+password');

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValid = await user.comparePassword(payload.password);
    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new AppError(403, 'Email is not verified. Please verify your email first.');
    }

    const token = signJwt({ userId: String(user._id), role: user.role });
    return { token, user };
  }

  static async forgotPasswordRequest(payload: { email: string }) {
    const user = await UserModel.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      return;
    }

    await sendOtpForPurpose(user, 'password_reset', 'Reset your password', 'Password Reset');
  }

  static async resetPassword(payload: { email: string; otp: string; newPassword: string }) {
    const user = await verifyOtp({
      email: payload.email,
      otp: payload.otp,
      purpose: 'password_reset'
    });

    user.password = payload.newPassword;
    await user.save();
  }
}
