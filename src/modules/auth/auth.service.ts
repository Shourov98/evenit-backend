import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';
import { buildOtpEmailHtml, sendEmail } from '../../common/utils/email';
import { signJwt } from '../../common/utils/jwt';
import { generateOtpCode, hashOtpCode } from '../../common/utils/otp';
import { AuthOtpModel, OtpPurpose } from './auth-otp.model';
import {
  IEventProviderOnboarding,
  IServiceProviderOnboarding,
  IUser,
  IVenueProviderOnboarding,
  IVerificationInfo,
  UserModel,
  UserRole
} from './auth.model';

const otpExpiryMs = Number(env.OTP_EXPIRY_MINUTES) * 60 * 1000;
const otpCooldownMs = Number(env.OTP_RESEND_COOLDOWN_SECONDS) * 1000;

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'customer' | 'service_provider' | 'event_planner' | 'venue_provider'>;
  serviceCategories: string[];
}

interface SubmitOnboardingCommonPayload {
  userId: string;
  verification: IVerificationInfo;
  stripeAccountId?: string;
  businessAddress?: string;
}

interface SubmitServiceProviderOnboardingPayload {
  userId: string;
  _id: string;
  name: string;
  email: string;
  stripeAccountId?: string;
  profileInfo: IServiceProviderOnboarding['profileInfo'];
  services: string[];
}
type SubmitEventProviderOnboardingPayload = SubmitOnboardingCommonPayload &
  IEventProviderOnboarding;
type SubmitVenueProviderOnboardingPayload = SubmitOnboardingCommonPayload &
  IVenueProviderOnboarding;

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
  private static async getUserForOnboarding(
    userId: string,
    role: Extract<UserRole, 'service_provider' | 'event_planner' | 'venue_provider'>
  ) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.role !== role) {
      throw new AppError(400, `${role} can only submit ${role} onboarding`);
    }

    return user;
  }

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

  static async submitServiceProviderOnboarding(payload: SubmitServiceProviderOnboardingPayload) {
    const user = await AuthService.getUserForOnboarding(payload.userId, 'service_provider');
    if (payload._id !== String(user._id)) {
      throw new AppError(400, '_id must match the authenticated service provider');
    }

    if (payload.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new AppError(400, 'email must match the authenticated service provider');
    }

    if (payload.name.trim() !== user.fullName) {
      throw new AppError(400, 'name must match the authenticated service provider');
    }

    user.onboarding = {
      verification: {
        businessType: payload.profileInfo.verification.businessType,
        companyName: payload.profileInfo.verification.companyName,
        nationalIdOrTradeLicenseUrl:
          payload.profileInfo.verification.nationalIdOrTradeLicenseFiles[0]
      },
      stripeAccountId: payload.stripeAccountId,
      serviceProvider: {
        _id: payload._id,
        name: payload.name,
        email: payload.email.toLowerCase(),
        profileInfo: payload.profileInfo,
        services: payload.services
      },
      eventProvider: undefined,
      venueProvider: undefined,
      submittedAt: new Date()
    };

    await user.save();

    return user;
  }

  static async submitEventProviderOnboarding(payload: SubmitEventProviderOnboardingPayload) {
    const user = await AuthService.getUserForOnboarding(payload.userId, 'event_planner');
    if (payload._id !== String(user._id)) {
      throw new AppError(400, '_id must match the authenticated event planner');
    }

    if (payload.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new AppError(400, 'email must match the authenticated event planner');
    }

    if (payload.fullName.trim() !== user.fullName) {
      throw new AppError(400, 'fullName must match the authenticated event planner');
    }

    user.onboarding = {
      verification: {
        businessType: payload.profileInfo.verification.businessType,
        companyName: payload.profileInfo.verification.companyName,
        nationalIdOrTradeLicenseUrl:
          payload.profileInfo.verification.nationalIdOrTradeLicenseFiles[0]
      },
      stripeAccountId: payload.stripeAccountId,
      serviceProvider: undefined,
      eventProvider: {
        _id: payload._id,
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        profileInfo: payload.profileInfo
      },
      venueProvider: undefined,
      submittedAt: new Date()
    };

    await user.save();

    return user;
  }

  static async submitVenueProviderOnboarding(payload: SubmitVenueProviderOnboardingPayload) {
    const user = await AuthService.getUserForOnboarding(payload.userId, 'venue_provider');
    if (payload._id !== String(user._id)) {
      throw new AppError(400, '_id must match the authenticated venue provider');
    }

    if (payload.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new AppError(400, 'email must match the authenticated venue provider');
    }

    if (payload.fullName.trim() !== user.fullName) {
      throw new AppError(400, 'fullName must match the authenticated venue provider');
    }

    user.onboarding = {
      verification: {
        businessType: payload.businessType,
        companyName: payload.legalBusinessName,
        nationalIdOrTradeLicenseUrl: payload.registrationNo ?? ''
      },
      stripeAccountId: payload.stripeAccountId,
      serviceProvider: undefined,
      eventProvider: undefined,
      venueProvider: {
        _id: payload._id,
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        stripeAccountId: payload.stripeAccountId,
        businessName: payload.businessName,
        businessType: payload.businessType,
        legalBusinessName: payload.legalBusinessName,
        registrationNo: payload.registrationNo,
        businessMail: payload.businessMail.toLowerCase(),
        businessPhoneNo: payload.businessPhoneNo
      },
      submittedAt: new Date()
    };

    await user.save();

    return user;
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
