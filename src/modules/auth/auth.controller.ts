import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { AuthService } from './auth.service';

export class AuthController {
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage ?? null,
          subscription: user.subscription,
          onboarding: user.onboarding ?? null
        }
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage ?? null,
          subscription: user.subscription,
          onboarding: user.onboarding ?? null
        }
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage ?? null,
          subscription: user.subscription,
          onboarding: user.onboarding ?? null
        }
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage ?? null,
          subscription: user.subscription,
          onboarding: user.onboarding ?? null
        }
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          subscription: user.subscription,
          onboarding: user.onboarding ?? null
        }
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage ?? null,
          onboarding: user.onboarding ?? null
        }
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
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage ?? null,
          onboarding: user.onboarding ?? null
        }
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

  static me = catchAsync(async (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  });
}
