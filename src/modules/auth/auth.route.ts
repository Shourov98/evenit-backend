import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { parseMultipartJsonBody } from '../../common/middlewares/multipart-json.middleware';
import { authLimiter } from '../../common/middlewares/security.middleware';
import { onboardingDocumentUpload } from '../../common/middlewares/upload.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { uploadOnboardingFiles } from './auth-onboarding-upload.middleware';
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
  updateProfileSchema,
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
 *         profileImage:
 *           nullable: true
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *             publicId:
 *               type: string
 *         subscription:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *               enum: [customer_plan, event_planner_plan, service_provider_plan, venue_provider_plan, admin_plan, super_admin_plan]
 *               example: customer_plan
 *             status:
 *               type: string
 *               enum: [subscribed, not_subscribed]
 *               example: not_subscribed
 *             activatedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *             payment:
 *               type: object
 *               properties:
 *                 amount:
 *                   type: number
 *                   example: 500
 *                 currency:
 *                   type: string
 *                   example: GBP
 *                 billingCycle:
 *                   type: string
 *                   enum: [monthly, yearly]
 *                   example: monthly
 *                 status:
 *                   type: string
 *                   enum: [paid, unpaid]
 *                   example: unpaid
 *                 paidAt:
 *                   type: string
 *                   format: date-time
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
 *       required: [nidOrTradeLicenseNumber, serviceName, serviceCategory, coverageArea, verification]
 *       properties:
 *         nidOrTradeLicenseNumber:
 *           type: string
 *           example: 1234567890123
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
 *     OnboardingMultipartRequest:
 *       type: object
 *       required: [payload]
 *       properties:
 *         payload:
 *           type: string
 *           description: JSON string matching the onboarding request schema for the selected role.
 *           example: '{"_id":"65f1a9d0f1b2c3d4e5f60001","name":"Service Provider Example","email":"service.provider@example.com","profileInfo":{"nidOrTradeLicenseNumber":"1234567890123","serviceName":"Premium Catering","serviceCategory":"Catering","coverageArea":["Dhaka"],"verification":{"businessType":"individual"}},"services":[]}'
 *         nationalIdOrTradeLicenseFiles:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *         file:
 *           type: string
 *           format: binary
 *         files:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *     EventPlannerProfileInfoInput:
 *       type: object
 *       required: [nidOrTradeLicenseNumber, name, coverageArea, address, verification]
 *       properties:
 *         nidOrTradeLicenseNumber:
 *           type: string
 *           example: 1234567890123
 *         name:
 *           type: string
 *           example: Star Events
 *         description:
 *           type: string
 *           example: Wedding and corporate event planning
 *         coverageArea:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Dhaka", "Chattogram"]
 *         address:
 *           type: string
 *           example: Banani, Dhaka
 *         verification:
 *           $ref: '#/components/schemas/ServiceProviderVerificationInput'
 *     VenueProviderProfileInfoInput:
 *       type: object
 *       required: [nidOrTradeLicenseNumber, businessName, businessType, businessMail, businessPhoneNo]
 *       properties:
 *         nidOrTradeLicenseNumber:
 *           type: string
 *           example: 1234567890123
 *         nationalIdOrTradeLicenseFiles:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example: ["https://cdn.example.com/trade-license.pdf"]
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
 *         profileInfo:
 *           $ref: '#/components/schemas/ServiceProviderProfileInfoInput'
 *         services:
 *           type: array
 *           items:
 *             type: string
 *           example: []
 *     EventPlannerOnboardingRequest:
 *       type: object
 *       required: [_id, fullName, email, profileInfo]
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
 *         profileInfo:
 *           $ref: '#/components/schemas/EventPlannerProfileInfoInput'
 *     VenueProviderOnboardingRequest:
 *       type: object
 *       required: [_id, fullName, email, profileInfo]
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
 *         profileInfo:
 *           $ref: '#/components/schemas/VenueProviderProfileInfoInput'
 *     ServiceProviderProfileInfoUpdateInput:
 *       type: object
 *       properties:
 *         nidOrTradeLicenseNumber:
 *           type: string
 *           example: 1234567890123
 *         serviceName:
 *           type: string
 *           example: Premium Catering
 *         serviceCategory:
 *           type: string
 *           example: Catering
 *         serviceDescription:
 *           type: string
 *           example: Updated service description
 *         coverageArea:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Dhaka", "Gazipur"]
 *         verification:
 *           type: object
 *           properties:
 *             businessType:
 *               type: string
 *               enum: [individual, company]
 *               example: company
 *             companyName:
 *               type: string
 *               example: Evenit Ltd
 *             nationalIdOrTradeLicenseFiles:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               example: ["https://example.com/trade-license.pdf"]
 *     EventPlannerProfileInfoUpdateInput:
 *       type: object
 *       properties:
 *         nidOrTradeLicenseNumber:
 *           type: string
 *           example: 1234567890123
 *         name:
 *           type: string
 *           example: Star Events
 *         description:
 *           type: string
 *           example: Updated planner description
 *         coverageArea:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Dhaka", "Chattogram"]
 *         address:
 *           type: string
 *           example: Banani, Dhaka
 *         verification:
 *           type: object
 *           properties:
 *             businessType:
 *               type: string
 *               enum: [individual, company]
 *               example: company
 *             companyName:
 *               type: string
 *               example: Star Events Ltd
 *             nationalIdOrTradeLicenseFiles:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               example: ["https://example.com/trade-license.pdf"]
 *     VenueProviderProfileInfoUpdateInput:
 *       type: object
 *       properties:
 *         nidOrTradeLicenseNumber:
 *           type: string
 *           example: 1234567890123
 *         nationalIdOrTradeLicenseFiles:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example: ["https://cdn.example.com/trade-license.pdf"]
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
 *     ServiceProviderProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated service providers.
 *         Common account fields can be updated at the top level.
 *         Provider-specific editable fields live inside `serviceProvider.profileInfo`.
 *         There is no common `phone` field on the user model.
 *       properties:
 *         fullName:
 *           type: string
 *           description: Updates both the top-level user fullName and onboarding.serviceProvider.name.
 *           example: Marvin McKinney
 *         email:
 *           type: string
 *           format: email
 *           description: Updates both the top-level user email and onboarding.serviceProvider.email.
 *           example: marvin@example.com
 *         serviceCategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Stored on the top-level user document for service providers only.
 *           example: ["Catering", "Decoration"]
 *         serviceProvider:
 *           type: object
 *           description: Role-specific profile fields for service providers.
 *           properties:
 *             profileInfo:
 *               $ref: '#/components/schemas/ServiceProviderProfileInfoUpdateInput'
 *             services:
 *               type: array
 *               items:
 *                 type: string
 *               description: Replaces onboarding.serviceProvider.services.
 *               example: ["Buffet", "Corporate Events"]
 *     EventPlannerProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated event planners.
 *         Common account fields can be updated at the top level.
 *         Planner-specific editable fields live inside `eventPlanner.profileInfo`.
 *         There is no common `phone` field on the user model.
 *       properties:
 *         fullName:
 *           type: string
 *           description: Updates both the top-level user fullName and onboarding.eventProvider.fullName.
 *           example: Star Events
 *         email:
 *           type: string
 *           format: email
 *           description: Updates both the top-level user email and onboarding.eventProvider.email.
 *           example: planner@example.com
 *         eventPlanner:
 *           type: object
 *           description: Role-specific profile fields for event planners.
 *           properties:
 *             profileInfo:
 *               $ref: '#/components/schemas/EventPlannerProfileInfoUpdateInput'
 *     VenueProviderProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated venue providers.
 *         Common account fields can be updated at the top level.
 *         Venue-specific editable fields live inside `venueProvider.profileInfo`.
 *         Venue providers do not have a common phone field, but they do have
 *         `businessPhoneNo` inside `venueProvider.profileInfo`.
 *       properties:
 *         fullName:
 *           type: string
 *           description: Updates both the top-level user fullName and onboarding.venueProvider.fullName.
 *           example: Royal Hall Owner
 *         email:
 *           type: string
 *           format: email
 *           description: Updates both the top-level user email and onboarding.venueProvider.email.
 *           example: venue@example.com
 *         venueProvider:
 *           type: object
 *           description: Role-specific profile fields for venue providers.
 *           properties:
 *             profileInfo:
 *               $ref: '#/components/schemas/VenueProviderProfileInfoUpdateInput'
 *     CustomerProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated customers.
 *         Only common account fields are available. There is currently no stored
 *         common `phone` field for customers.
 *       properties:
 *         fullName:
 *           type: string
 *           description: Updates the top-level user fullName.
 *           example: Marvin McKinney
 *         email:
 *           type: string
 *           format: email
 *           description: Updates the top-level user email.
 *           example: marvin@example.com
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
 *     AuthOnboardingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Onboarding information submitted successfully
 *         data:
 *           type: object
 *           properties:
 *             onboarding:
 *               type: object
 *               nullable: true
 *               example:
 *                 submittedAt: 2026-03-24T10:30:00.000Z
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
 *               $ref: '#/components/schemas/AuthOnboardingResponse'
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
router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailOtpSchema),
  AuthController.verifyEmailOtp
);

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
 *         description: Email not verified or admin users must use the admin login endpoint
 */
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

/**
 * @openapi
 * /api/v1/auth/admin/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login admin or super-admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified or user is not an admin
 */
router.post(
  '/admin/login',
  authLimiter,
  validate(loginSchema),
  AuthController.adminLogin
);

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
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingMultipartRequest'
 *     responses:
 *       200:
 *         description: Onboarding submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthOnboardingResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/service-provider',
  protect,
  onboardingDocumentUpload.fields([
    { name: 'nationalIdOrTradeLicenseFiles', maxCount: 10 },
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  uploadOnboardingFiles('service-providers'),
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingMultipartRequest'
 *     responses:
 *       200:
 *         description: Onboarding submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthOnboardingResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboarding/event-planner',
  protect,
  onboardingDocumentUpload.fields([
    { name: 'nationalIdOrTradeLicenseFiles', maxCount: 10 },
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  uploadOnboardingFiles('event-planners'),
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/OnboardingMultipartRequest'
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
  onboardingDocumentUpload.fields([
    { name: 'nationalIdOrTradeLicenseFiles', maxCount: 10 },
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  uploadOnboardingFiles('venue-providers'),
  validate(submitVenueProviderOnboardingSchema),
  AuthController.submitVenueProviderOnboarding
);

/**
 * @openapi
 * /api/v1/auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update current authenticated user profile
 *     description: >
 *       Role-aware partial profile update endpoint for the authenticated user.
 *       All roles can update common account fields such as `fullName` and `email`.
 *       Service providers can additionally update `serviceCategories`,
 *       `serviceProvider.profileInfo`, and `serviceProvider.services`.
 *       Event planners can update `eventPlanner.profileInfo`.
 *       Venue providers can update `venueProvider.profileInfo`, including `businessPhoneNo`.
 *       Customers can update only common account fields.
 *       There is currently no top-level/common `phone` field stored in the user model.
 *       If provider onboarding has not been completed yet, role-specific nested profile
 *       sections cannot be updated.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CustomerProfileUpdateRequest'
 *               - $ref: '#/components/schemas/ServiceProviderProfileUpdateRequest'
 *               - $ref: '#/components/schemas/EventPlannerProfileUpdateRequest'
 *               - $ref: '#/components/schemas/VenueProviderProfileUpdateRequest'
 *           examples:
 *             customer:
 *               summary: Customer update
 *               value:
 *                 fullName: Marvin McKinney
 *                 email: marvin@example.com
 *             serviceProvider:
 *               summary: Service provider update
 *               value:
 *                 fullName: Marvin McKinney
 *                 email: marvin@example.com
 *                 serviceCategories:
 *                   - Catering
 *                   - Decoration
 *                 serviceProvider:
 *                   profileInfo:
 *                     serviceName: Premium Catering
 *                     serviceCategory: Catering
 *                     coverageArea:
 *                       - Dhaka
 *                       - Gazipur
 *                   services:
 *                     - Buffet
 *                     - Corporate Events
 *             eventPlanner:
 *               summary: Event planner update
 *               value:
 *                 fullName: Star Events
 *                 eventPlanner:
 *                   profileInfo:
 *                     name: Star Events
 *                     address: Banani, Dhaka
 *                     coverageArea:
 *                       - Dhaka
 *                       - Chattogram
 *             venueProvider:
 *               summary: Venue provider update
 *               value:
 *                 fullName: Royal Hall Owner
 *                 venueProvider:
 *                   profileInfo:
 *                     businessName: Royal Hall
 *                     businessMail: info@royalhall.com
 *                     businessPhoneNo: +8801700000000
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserResponse'
 *       400:
 *         description: Validation error or role-specific payload mismatch
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Duplicate email
 */
router.patch('/profile', protect, validate(updateProfileSchema), AuthController.updateProfile);

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
