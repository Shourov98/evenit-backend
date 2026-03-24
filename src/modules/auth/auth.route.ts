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
  submitEventProviderOnboardingSchema,
  submitServiceProviderOnboardingSchema,
  submitVenueProviderOnboardingSchema,
  verifyEmailOtpSchema
} from './auth.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Registration, login, OTP verification, onboarding, and current-user endpoints
 * components:
 *   schemas:
 *     AuthUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60001
 *         fullName:
 *           type: string
 *           example: Marvin McKinney
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *         role:
 *           type: string
 *           enum: [customer, service_provider, event_planner, venue_provider, admin, super_admin]
 *           example: customer
 *         serviceCategories:
 *           type: array
 *           items:
 *             type: string
 *           example: []
 *         isEmailVerified:
 *           type: boolean
 *           example: false
 *         onboarding:
 *           nullable: true
 *           type: object
 *     AuthRegisterRequest:
 *       type: object
 *       required: [fullName, email, password, role]
 *       properties:
 *         fullName:
 *           type: string
 *           example: Marvin McKinney
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: strongPass123
 *         role:
 *           type: string
 *           enum: [customer, service_provider, event_planner, venue_provider]
 *           example: customer
 *     AuthLoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: strongPass123
 *     VerifyOtpRequest:
 *       type: object
 *       required: [email, otp]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *         otp:
 *           type: string
 *           example: "123456"
 *     EmailOnlyRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *     ResetPasswordRequest:
 *       type: object
 *       required: [email, otp, newPassword]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *         otp:
 *           type: string
 *           example: "123456"
 *         newPassword:
 *           type: string
 *           format: password
 *           example: newStrongPass123
 *     VerificationInfoInput:
 *       type: object
 *       required: [businessType, nationalIdOrTradeLicenseUrl]
 *       properties:
 *         businessType:
 *           type: string
 *           enum: [individual, company]
 *           example: company
 *         companyName:
 *           type: string
 *           example: Evenit Ltd
 *         nationalIdOrTradeLicenseUrl:
 *           type: string
 *           format: uri
 *           example: https://example.com/trade-license.pdf
 *     ServiceProviderVerificationInput:
 *       type: object
 *       required: [businessType, nationalIdOrTradeLicenseFiles]
 *       properties:
 *         businessType:
 *           type: string
 *           enum: [individual, company]
 *           example: individual
 *         companyName:
 *           type: string
 *           example: Evenit Ltd
 *         nationalIdOrTradeLicenseFiles:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example: ["https://example.com/nid-front.jpg", "https://example.com/trade-license.pdf"]
 *     ServiceProviderProfileInfoInput:
 *       type: object
 *       required: [serviceName, serviceCategory, coverageArea, verification]
 *       properties:
 *         serviceName:
 *           type: string
 *           example: Premium Catering
 *         serviceCategory:
 *           type: string
 *           example: Catering
 *         serviceDescription:
 *           type: string
 *           example: Corporate and wedding catering services
 *         coverageArea:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Dhaka", "Gazipur"]
 *         verification:
 *           $ref: '#/components/schemas/ServiceProviderVerificationInput'
 *     EventPlannerOnboardingInput:
 *       type: object
 *       required: [_id, fullName, email, stripeAccountId, profileInfo]
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60002
 *         fullName:
 *           type: string
 *           example: Star Events
 *         email:
 *           type: string
 *           format: email
 *           example: planner@example.com
 *         stripeAccountId:
 *           type: string
 *           example: acct_1Example123456789
 *         profileInfo:
 *           type: object
 *           required: [name, coverageArea, address, verification]
 *           properties:
 *             name:
 *               type: string
 *               example: Star Events
 *             description:
 *               type: string
 *               example: Wedding and corporate event planning
 *             coverageArea:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Dhaka", "Chattogram"]
 *             address:
 *               type: string
 *               example: Banani, Dhaka
 *             verification:
 *               $ref: '#/components/schemas/ServiceProviderVerificationInput'
 *     VenueProviderOnboardingInput:
 *       type: object
 *       required: [_id, fullName, email, stripeAccountId, businessName, businessType, legalBusinessName, registrationNo, businessMail, businessPhoneNo]
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60003
 *         fullName:
 *           type: string
 *           example: Royal Hall Owner
 *         email:
 *           type: string
 *           format: email
 *           example: venue@example.com
 *         stripeAccountId:
 *           type: string
 *           example: acct_1Example123456789
 *         businessName:
 *           type: string
 *           example: Royal Hall
 *         businessType:
 *           type: string
 *           enum: [individual, company]
 *           example: company
 *         legalBusinessName:
 *           type: string
 *           example: Royal Hall Ltd
 *         registrationNo:
 *           type: string
 *           example: TRD-123456
 *         businessMail:
 *           type: string
 *           format: email
 *           example: info@royalhall.com
 *         businessPhoneNo:
 *           type: string
 *           example: +8801700000000
 *     ServiceProviderOnboardingRequest:
 *       type: object
 *       required: [_id, name, email, profileInfo]
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60001
 *         name:
 *           type: string
 *           example: Marvin McKinney
 *         email:
 *           type: string
 *           format: email
 *           example: marvin@example.com
 *         stripeAccountId:
 *           type: string
 *           example: acct_1Example123456789
 *         profileInfo:
 *           $ref: '#/components/schemas/ServiceProviderProfileInfoInput'
 *         services:
 *           type: array
 *           items:
 *             type: string
 *           example: []
 *     EventPlannerOnboardingRequest:
 *       type: object
 *       required: [_id, fullName, email, stripeAccountId, profileInfo]
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60002
 *         fullName:
 *           type: string
 *           example: Star Events
 *         email:
 *           type: string
 *           format: email
 *           example: planner@example.com
 *         stripeAccountId:
 *           type: string
 *           example: acct_1Example123456789
 *         profileInfo:
 *           $ref: '#/components/schemas/EventPlannerOnboardingInput'
 *     VenueProviderOnboardingRequest:
 *       type: object
 *       required: [_id, fullName, email, stripeAccountId, businessName, businessType, legalBusinessName, registrationNo, businessMail, businessPhoneNo]
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60003
 *         fullName:
 *           type: string
 *           example: Royal Hall Owner
 *         email:
 *           type: string
 *           format: email
 *           example: venue@example.com
 *         stripeAccountId:
 *           type: string
 *           example: acct_1Example123456789
 *         businessName:
 *           type: string
 *           example: Royal Hall
 *         businessType:
 *           type: string
 *           enum: [individual, company]
 *           example: company
 *         legalBusinessName:
 *           type: string
 *           example: Royal Hall Ltd
 *         registrationNo:
 *           type: string
 *           example: TRD-123456
 *         businessMail:
 *           type: string
 *           format: email
 *           example: info@royalhall.com
 *         businessPhoneNo:
 *           type: string
 *           example: +8801700000000
 *     AuthUserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/AuthUser'
 *     AuthTokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example
 *             user:
 *               $ref: '#/components/schemas/AuthUser'
 *     AuthMeResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *               example: 65f1a9d0f1b2c3d4e5f60001
 *             email:
 *               type: string
 *               format: email
 *             fullName:
 *               type: string
 *             role:
 *               type: string
 *             serviceCategories:
 *               type: array
 *               items:
 *                 type: string
 *             onboarding:
 *               nullable: true
 *               type: object
 *     AuthMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Verification OTP sent
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register user and send verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterRequest'
 *     responses:
 *       201:
 *         description: User registered and OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate value detected
 */
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Invalid OTP or validation error
 */
router.post('/verify-email', authLimiter, validate(verifyEmailOtpSchema), AuthController.verifyEmailOtp);

/**
 * @openapi
 * /api/v1/auth/resend-verification-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailOnlyRequest'
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageResponse'
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailOnlyRequest'
 *     responses:
 *       200:
 *         description: Reset OTP handling response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageResponse'
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageResponse'
 *       400:
 *         description: Validation error or invalid OTP
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

/**
 * @openapi
 * /api/v1/auth/onboarding/service-provider:
 *   post:
 *     tags: [Auth]
 *     summary: Submit service provider onboarding details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceProviderOnboardingRequest'
 *     responses:
 *       200:
 *         description: Onboarding submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/service-provider',
  protect,
  validate(submitServiceProviderOnboardingSchema),
  AuthController.submitServiceProviderOnboarding
);

/**
 * @openapi
 * /api/v1/auth/onboarding/event-planner:
 *   post:
 *     tags: [Auth]
 *     summary: Submit event planner onboarding details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventPlannerOnboardingRequest'
 *     responses:
 *       200:
 *         description: Onboarding submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/event-planner',
  protect,
  validate(submitEventProviderOnboardingSchema),
  AuthController.submitEventProviderOnboarding
);

/**
 * @openapi
 * /api/v1/auth/onboarding/venue-provider:
 *   post:
 *     tags: [Auth]
 *     summary: Submit venue provider onboarding details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenueProviderOnboardingRequest'
 *     responses:
 *       200:
 *         description: Onboarding submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/venue-provider',
  protect,
  validate(submitVenueProviderOnboardingSchema),
  AuthController.submitVenueProviderOnboarding
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMeResponse'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, AuthController.me);

export const authRouter = router;
