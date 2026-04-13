import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { AuthService } from './auth.service';

const serializeAuthUser = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
  serviceCategories: string[];
  isEmailVerified: boolean;
  profileImage?: unknown;
  coverImage?: unknown;
  subscription?: unknown;
  onboarding?: unknown;
}) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  serviceCategories: user.serviceCategories,
  isEmailVerified: user.isEmailVerified,
  profileImage:
    user.profileImage && typeof user.profileImage === 'object' && 'url' in user.profileImage
      ? user.profileImage.url
      : null,
  coverImage:
    user.coverImage && typeof user.coverImage === 'object' && 'url' in user.coverImage
      ? user.coverImage.url
      : null,
  subscription: user.subscription,
  onboarding: user.onboarding ?? null
});

export class AuthController {
  private static getMultipartFiles(req: Request) {
    return req.files && !Array.isArray(req.files) ? req.files : undefined;
  }

  private static updateProfileByRole(expectedRole: 'customer' | 'service_provider' | 'event_planner' | 'venue_provider') {
    return catchAsync(async (req: Request, res: Response) => {
      const userId = AuthController.getAuthorizedUserId(req, res);
      if (!userId) {
        return;
      }

      if (req.user?.role !== expectedRole) {
        return res.status(400).json({
          success: false,
          message: `This endpoint can only be used by ${expectedRole}`
        });
      }

      const files = AuthController.getMultipartFiles(req);
      const user = await AuthService.updateProfile({
        userId,
        role: req.user.role,
        profileImageFile: files?.profileImage?.[0],
        coverImageFile: files?.coverImage?.[0],
        ...req.body
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: serializeAuthUser(user)
        }
      });
    });
  }

  static register = catchAsync(async (req: Request, res: Response) => {
    const { fullName, email, password, role, serviceCategories } = req.body as {
      fullName: string;
      email: string;
      password: string;
      role: 'customer' | 'service_provider' | 'event_planner' | 'venue_provider';
      serviceCategories?: string[];
    };

    const { user, deliveryMode } = await AuthService.register({
      fullName,
      email,
      password,
      role,
      serviceCategories: serviceCategories ?? []
    });

    return res.status(201).json({
      success: true,
      message:
        deliveryMode === 'console'
          ? 'User registered successfully. OTP printed in the server terminal for verification.'
          : 'User registered successfully. OTP sent to email for verification.',
      data: {
        user: serializeAuthUser(user)
      }
    });
  });

  private static getAuthorizedUserId(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required: sign in before submitting onboarding information'
      });
      return null;
    }

    return userId;
  }

  static submitServiceProviderOnboarding = catchAsync(async (req: Request, res: Response) => {
    const userId = AuthController.getAuthorizedUserId(req, res);
    if (!userId) {
      return;
    }

    const user = await AuthService.submitServiceProviderOnboarding({
      userId,
      ...req.body
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding information submitted successfully',
      data: {
        onboarding: user.onboarding ?? null,
        user: serializeAuthUser(user)
      }
    });
  });

  static submitEventProviderOnboarding = catchAsync(async (req: Request, res: Response) => {
    const userId = AuthController.getAuthorizedUserId(req, res);
    if (!userId) {
      return;
    }

    const user = await AuthService.submitEventProviderOnboarding({
      userId,
      ...req.body
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding information submitted successfully',
      data: {
        onboarding: user.onboarding ?? null,
        user: serializeAuthUser(user)
      }
    });
  });

  static submitVenueProviderOnboarding = catchAsync(async (req: Request, res: Response) => {
    const userId = AuthController.getAuthorizedUserId(req, res);
    if (!userId) {
      return;
    }

    const user = await AuthService.submitVenueProviderOnboarding({
      userId,
      ...req.body
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding information submitted successfully',
      data: {
        onboarding: user.onboarding ?? null,
        user: serializeAuthUser(user)
      }
    });
  });

  static resendVerificationOtp = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const { deliveryMode } = await AuthService.resendVerificationOtp({ email });

    return res.status(200).json({
      success: true,
      message:
        deliveryMode === 'console'
          ? 'Verification OTP printed in the server terminal.'
          : 'Verification OTP sent'
    });
  });

  static verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body as { email: string; otp: string };
    const { token, user } = await AuthService.verifyEmailOtp({ email, otp });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: serializeAuthUser(user)
      }
    });
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const { token, user } = await AuthService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: serializeAuthUser(user)
      }
    });
  });

  static adminLogin = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const { token, user } = await AuthService.adminLogin({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: {
        token,
        user: serializeAuthUser(user)
      }
    });
  });

  static forgotPasswordRequest = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const { deliveryMode } = await AuthService.forgotPasswordRequest({ email });

    return res.status(200).json({
      success: true,
      message:
        deliveryMode === 'console'
          ? 'If an account exists for this email, the reset OTP was printed in the server terminal.'
          : 'If an account exists for this email, a reset OTP has been sent.'
    });
  });

  static resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body as {
      email: string;
      otp: string;
      newPassword: string;
    };

    await AuthService.resetPassword({ email, otp, newPassword });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  });

  static updateCustomerProfile = AuthController.updateProfileByRole('customer');
  static updateServiceProviderProfile = AuthController.updateProfileByRole('service_provider');
  static updateEventPlannerProfile = AuthController.updateProfileByRole('event_planner');
  static updateVenueProviderProfile = AuthController.updateProfileByRole('venue_provider');

  static me = catchAsync(async (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  });
}
