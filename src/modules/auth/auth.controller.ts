import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { AuthService } from './auth.service';

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response) => {
    const { fullName, email, password, role, serviceCategories } = req.body as {
      fullName: string;
      email: string;
      password: string;
      role: 'customer' | 'service_provider' | 'event_provider' | 'venue_provider';
      serviceCategories: string[];
    };

    const { user } = await AuthService.register({
      fullName,
      email,
      password,
      role,
      serviceCategories
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. OTP sent to email for verification.',
      data: {
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          onboarding: user.onboarding ?? null
        }
      }
    });
  });

  static submitOnboarding = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await AuthService.submitOnboarding({
      userId,
      ...req.body
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding information submitted successfully',
      data: {
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          serviceCategories: user.serviceCategories,
          isEmailVerified: user.isEmailVerified,
          onboarding: user.onboarding ?? null
        }
      }
    });
  });

  static resendVerificationOtp = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    await AuthService.resendVerificationOtp({ email });

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent'
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
          onboarding: user.onboarding ?? null
        }
      }
    });
  });

  static forgotPasswordRequest = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    await AuthService.forgotPasswordRequest({ email });

    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a reset OTP has been sent.'
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
