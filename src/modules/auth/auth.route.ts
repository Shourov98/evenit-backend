import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { authLimiter } from '../../common/middlewares/security.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { AuthController } from './auth.controller';
import {
  forgotPasswordRequestSchema,
  loginSchema,
  registerSchema,
  resendVerificationOtpSchema,
  resetPasswordSchema,
  submitOnboardingSchema,
  verifyEmailOtpSchema
} from './auth.schema';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register user and send verification OTP
 */
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP
 */
router.post('/verify-email', authLimiter, validate(verifyEmailOtpSchema), AuthController.verifyEmailOtp);

/**
 * @openapi
 * /api/v1/auth/resend-verification-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification OTP
 */
router.post(
  '/resend-verification-otp',
  authLimiter,
  validate(resendVerificationOtpSchema),
  AuthController.resendVerificationOtp
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user (email must be verified)
 */
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send password reset OTP
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordRequestSchema),
  AuthController.forgotPasswordRequest
);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with OTP
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

/**
 * @openapi
 * /api/v1/auth/onboarding:
 *   post:
 *     tags: [Auth]
 *     summary: Submit provider onboarding details
 *     security:
 *       - bearerAuth: []
 */
router.post('/onboarding', protect, validate(submitOnboardingSchema), AuthController.submitOnboarding);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', protect, AuthController.me);

export const authRouter = router;
