import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { parseMultipartJsonBody } from '../../common/middlewares/multipart-json.middleware';
import { authLimiter } from '../../common/middlewares/security.middleware';
import { onboardingDocumentUpload } from '../../common/middlewares/upload.middleware';
import { imageUpload } from '../../common/middlewares/upload.middleware';
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
  updateCustomerProfileSchema,
  updateEventPlannerProfileRequestSchema,
  updateServiceProviderProfileRequestSchema,
  updateVenueProviderProfileRequestSchema,
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
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           example: +8801712345678
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
 *         coverageArea:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Dhaka", "Gazipur"]
 *         verification:
 *           deprecated: true
 *           description: Verification fields are not editable through the profile update API.
 *     EventPlannerProfileInfoUpdateInput:
 *       type: object
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: +8801712345678
 *         coverageArea:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Dhaka", "Chattogram"]
 *         address:
 *           type: string
 *           example: Banani, Dhaka
 *         hourlyRate:
 *           type: number
 *           example: 7500
 *         currency:
 *           type: string
 *           example: BDT
 *         verification:
 *           deprecated: true
 *           description: Verification fields are not editable through the profile update API.
 *     VenueProviderProfileInfoUpdateInput:
 *       type: object
 *       properties:
 *         businessPhoneNo:
 *           type: string
 *           example: +8801700000000
 *     ServiceProviderProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated service providers.
 *         `fullName`, phone, and location fields are editable through this endpoint.
 *         `email`, categories, services, and verification fields are not editable here.
 *       properties:
 *         fullName:
 *           type: string
 *           example: Updated Service Provider Name
 *         phoneNumber:
 *           type: string
 *           example: +8801712345678
 *         serviceProvider:
 *           type: object
 *           description: Role-specific editable fields for service providers.
 *           properties:
 *             profileInfo:
 *               $ref: '#/components/schemas/ServiceProviderProfileInfoUpdateInput'
 *     EventPlannerProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated event planners.
 *         `fullName`, phone, location, and hourly pricing fields are editable through this endpoint.
 *         `email` and verification fields are not editable here.
 *       properties:
 *         fullName:
 *           type: string
 *           example: Updated Event Planner Name
 *         phoneNumber:
 *           type: string
 *           example: +8801712345678
 *         eventPlanner:
 *           type: object
 *           description: Role-specific editable fields for event planners.
 *           properties:
 *             profileInfo:
 *               $ref: '#/components/schemas/EventPlannerProfileInfoUpdateInput'
 *     VenueProviderProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Partial update payload for authenticated venue providers.
 *         `fullName` and phone fields are editable through this endpoint.
 *         `email`, business identity, and verification fields are not editable here.
 *       properties:
 *         fullName:
 *           type: string
 *           example: Updated Venue Provider Name
 *         phoneNumber:
 *           type: string
 *           example: +8801712345678
 *         venueProvider:
 *           type: object
 *           description: Role-specific editable fields for venue providers.
 *           properties:
 *             profileInfo:
 *               $ref: '#/components/schemas/VenueProviderProfileInfoUpdateInput'
 *     CustomerProfileUpdateRequest:
 *       type: object
 *       description: >
 *         Customers can update their common `fullName` and phone number fields.
 *       properties:
 *         fullName:
 *           type: string
 *           example: Updated Customer Name
 *         phoneNumber:
 *           type: string
 *           example: +8801712345678
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
 *             phoneNumber:
 *               type: string
 *               nullable: true
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
 * /api/v1/auth/profile/customer:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the authenticated customer profile
 *     description: Accepts either JSON or multipart form-data. For multipart requests, send the JSON payload in a `payload` field and optional files in `profileImage` and `coverImage`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerProfileUpdateRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: string
 *                 example: '{"fullName":"Updated Customer Name","phoneNumber":"+8801712345678"}'
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or role mismatch
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/auth/profile/service-provider:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the authenticated service provider profile
 *     description: Accepts either JSON or multipart form-data. For multipart requests, send the JSON payload in a `payload` field and optional files in `profileImage` and `coverImage`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceProviderProfileUpdateRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: string
 *                 example: '{"fullName":"Updated Service Provider Name","phoneNumber":"+8801712345678","serviceProvider":{"profileInfo":{"coverageArea":["Dhaka","Gazipur"]}}}'
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or role mismatch
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/auth/profile/event-planner:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the authenticated event planner profile
 *     description: Accepts either JSON or multipart form-data. For multipart requests, send the JSON payload in a `payload` field and optional files in `profileImage` and `coverImage`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventPlannerProfileUpdateRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: string
 *                 example: '{"fullName":"Updated Event Planner Name","phoneNumber":"+8801712345678","eventPlanner":{"profileInfo":{"address":"Banani, Dhaka","coverageArea":["Dhaka","Chattogram"],"hourlyRate":7500,"currency":"BDT"}}}'
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or role mismatch
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/auth/profile/venue-provider:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the authenticated venue provider profile
 *     description: Accepts either JSON or multipart form-data. For multipart requests, send the JSON payload in a `payload` field and optional files in `profileImage` and `coverImage`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenueProviderProfileUpdateRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: string
 *                 example: '{"fullName":"Updated Venue Provider Name","phoneNumber":"+8801712345678","venueProvider":{"profileInfo":{"businessPhoneNo":"+8801700000000"}}}'
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or role mismatch
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/profile/customer',
  protect,
  imageUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  parseMultipartJsonBody(),
  validate(updateCustomerProfileSchema),
  AuthController.updateCustomerProfile
);

router.patch(
  '/profile/service-provider',
  protect,
  imageUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  parseMultipartJsonBody(),
  validate(updateServiceProviderProfileRequestSchema),
  AuthController.updateServiceProviderProfile
);

router.patch(
  '/profile/event-planner',
  protect,
  imageUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  parseMultipartJsonBody(),
  validate(updateEventPlannerProfileRequestSchema),
  AuthController.updateEventPlannerProfile
);

router.patch(
  '/profile/venue-provider',
  protect,
  imageUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  parseMultipartJsonBody(),
  validate(updateVenueProviderProfileRequestSchema),
  AuthController.updateVenueProviderProfile
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
