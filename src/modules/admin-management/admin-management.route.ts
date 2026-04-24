import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { AdminManagementController } from './admin-management.controller';
import {
  adminUserIdParamSchema,
  analyticsYearQuerySchema,
  approvalRequestsQuerySchema,
  changeAdminPasswordSchema,
  customerIdParamSchema,
  createAdminSchema,
  eventPlannerUserIdParamSchema,
  serviceIdParamSchema,
  serviceProviderUserIdParamSchema,
  subscriptionUserIdParamSchema,
  updateAdminProfileSchema,
  venueIdParamSchema,
  venueProviderUserIdParamSchema
} from './admin-management.schema';

const router = Router();

router.use(protect, authorize('admin', 'super_admin'));

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Admin and super-admin moderation endpoints for services and venues
 * components:
 *   schemas:
 *     AdminPendingVenueListResponse:
 *       $ref: '#/components/schemas/VenueListResponse'
 *     AdminPendingServiceListResponse:
 *       $ref: '#/components/schemas/ServiceListResponse'
 *     AdminAnalyticsOverviewResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             revenue:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 125000
 *                 totalPlatformRevenue:
 *                   type: number
 *                   example: 12500
 *                 totalBookings:
 *                   type: integer
 *                   example: 128
 *                 currentMonthRevenue:
 *                   type: number
 *                   example: 9000
 *                 currentMonthPlatformRevenue:
 *                   type: number
 *                   example: 900
 *                 currentMonthBookings:
 *                   type: integer
 *                   example: 11
 *             users:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 850
 *                 totalCustomers:
 *                   type: integer
 *                   example: 420
 *                 totalEventPlanners:
 *                   type: integer
 *                   example: 90
 *                 totalServiceProviders:
 *                   type: integer
 *                   example: 220
 *                 totalVenueProviders:
 *                   type: integer
 *                   example: 120
 *                 currentMonth:
 *                   type: object
 *                   properties:
 *                     newUsers:
 *                       type: integer
 *                       example: 32
 *                     newCustomers:
 *                       type: integer
 *                       example: 16
 *                     newEventPlanners:
 *                       type: integer
 *                       example: 4
 *                     newServiceProviders:
 *                       type: integer
 *                       example: 8
 *                     newVenueProviders:
 *                       type: integer
 *                       example: 4
 *     AdminYearlyAnalyticsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *               example: 2024
 *             monthly:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: integer
 *                     example: 1
 *                   label:
 *                     type: string
 *                     example: Jan
 *                   revenue:
 *                     type: number
 *                     example: 15000
 *                   platformRevenue:
 *                     type: number
 *                     example: 1500
 *                   bookings:
 *                     type: integer
 *                     example: 17
 *                   totalNewUsers:
 *                     type: integer
 *                     example: 68
 *                   newCustomers:
 *                     type: integer
 *                     example: 31
 *                   newEventPlanners:
 *                     type: integer
 *                     example: 7
 *                   newServiceProviders:
 *                     type: integer
 *                     example: 18
 *                   newVenueProviders:
 *                     type: integer
 *                     example: 12
 *     AdminSelfProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6807f0c6c1b2f4a9d9123456
 *         fullName:
 *           type: string
 *           example: Admin Example
 *         email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           example: +8801712345678
 *         profileImage:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/profiles/admin-example.jpg
 *         role:
 *           type: string
 *           enum: [admin, super_admin]
 *           example: admin
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AdminSelfProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/AdminSelfProfile'
 *       example:
 *         success: true
 *         data:
 *           _id: 6807f0c6c1b2f4a9d9123456
 *           fullName: Admin Example
 *           email: admin@example.com
 *           phoneNumber: +8801712345678
 *           profileImage: https://cdn.example.com/profiles/admin-example.jpg
 *           role: admin
 *           createdAt: '2026-04-20T08:00:00.000Z'
 *           updatedAt: '2026-04-23T06:30:00.000Z'
 *     AdminUpdateProfileRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           example: Admin Example Updated
 *         phoneNumber:
 *           type: string
 *           example: +8801812345678
 *     AdminUpdateProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Profile updated successfully
 *         data:
 *           $ref: '#/components/schemas/AdminSelfProfile'
 *       example:
 *         success: true
 *         message: Profile updated successfully
 *         data:
 *           _id: 6807f0c6c1b2f4a9d9123456
 *           fullName: Admin Example Updated
 *           email: admin@example.com
 *           phoneNumber: +8801812345678
 *           profileImage: https://cdn.example.com/profiles/admin-example.jpg
 *           role: admin
 *           createdAt: '2026-04-20T08:00:00.000Z'
 *           updatedAt: '2026-04-23T06:30:00.000Z'
 *     AdminChangePasswordRequest:
 *       type: object
 *       required: [currentPassword, newPassword]
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           example: StrongAdminPass123
 *         newPassword:
 *           type: string
 *           format: password
 *           example: StrongerAdminPass456
 *     AdminChangePasswordResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Password changed successfully
 *     AdminRecentRegisteredUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6807f0c6c1b2f4a9d9123456
 *         fullName:
 *           type: string
 *           example: Saif Ul
 *         email:
 *           type: string
 *           format: email
 *           example: saif@example.com
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           example: +8801712345678
 *         role:
 *           type: string
 *           enum: [customer, event_planner, service_provider, venue_provider]
 *           example: service_provider
 *         serviceCategories:
 *           type: array
 *           items:
 *             type: string
 *           example: [Catering, Decoration]
 *         isEmailVerified:
 *           type: boolean
 *           example: true
 *         isBlocked:
 *           type: boolean
 *           example: false
 *         profileImage:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/profiles/saif.jpg
 *         coverImage:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/covers/saif-cover.jpg
 *         subscription:
 *           type: object
 *           nullable: true
 *           properties:
 *             plan:
 *               type: string
 *               example: service_provider_plan
 *             status:
 *               type: string
 *               example: subscribed
 *             activatedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *             stripeCustomerId:
 *               type: string
 *               nullable: true
 *             stripeSubscriptionId:
 *               type: string
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
 *                   example: monthly
 *                 status:
 *                   type: string
 *                   example: paid
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *         onboarding:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *         availabilityCalendar:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               hours:
 *                 type: array
 *                 items:
 *                   type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         registeredAt:
 *           type: string
 *           format: date-time
 *     AdminRecentRegisteredUsersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminRecentRegisteredUser'
 *       example:
 *         success: true
 *         data:
 *           - _id: 6807f0c6c1b2f4a9d9123456
 *             fullName: Saif Ul
 *             email: saif@example.com
 *             phoneNumber: +8801712345678
 *             role: service_provider
 *             serviceCategories:
 *               - Catering
 *               - Decoration
 *             isEmailVerified: true
 *             isBlocked: false
 *             profileImage: https://cdn.example.com/profiles/saif.jpg
 *             coverImage: https://cdn.example.com/covers/saif-cover.jpg
 *             subscription:
 *               plan: service_provider_plan
 *               status: subscribed
 *               activatedAt: '2026-04-20T08:10:15.000Z'
 *               stripeCustomerId: cus_123456
 *               stripeSubscriptionId: sub_123456
 *               payment:
 *                 amount: 500
 *                 currency: GBP
 *                 billingCycle: monthly
 *                 status: paid
 *                 paidAt: '2026-04-20T08:10:15.000Z'
 *             onboarding:
 *               submittedAt: '2026-04-20T08:15:10.000Z'
 *               serviceProvider:
 *                 profileInfo:
 *                   serviceName: Saif Catering
 *                   serviceCategory: Catering
 *             availabilityCalendar: []
 *             createdAt: '2026-04-20T08:00:00.000Z'
 *             updatedAt: '2026-04-22T10:30:00.000Z'
 *             registeredAt: '2026-04-20T08:00:00.000Z'
 *           - _id: 6807f0c6c1b2f4a9d9123457
 *             fullName: Nadia Rahman
 *             email: nadia@example.com
 *             phoneNumber: +8801812345678
 *             role: venue_provider
 *             serviceCategories: []
 *             isEmailVerified: false
 *             isBlocked: false
 *             profileImage: null
 *             coverImage: null
 *             subscription:
 *               plan: venue_provider_plan
 *               status: not_subscribed
 *               activatedAt: null
 *               stripeCustomerId: null
 *               stripeSubscriptionId: null
 *               payment:
 *                 amount: 50000
 *                 currency: GBP
 *                 billingCycle: yearly
 *                 status: unpaid
 *                 paidAt: null
 *             onboarding:
 *               submittedAt: null
 *               venueProvider:
 *                 profileInfo:
 *                   businessName: Skyline Rooftop
 *             availabilityCalendar: []
 *             createdAt: '2026-04-19T14:20:00.000Z'
 *             updatedAt: '2026-04-19T14:20:00.000Z'
 *             registeredAt: '2026-04-19T14:20:00.000Z'
 *     AdminSubscriptionListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6807f0c6c1b2f4a9d9123456
 *         userId:
 *           type: string
 *           example: 6807f0c6c1b2f4a9d9123456
 *         fullName:
 *           type: string
 *           example: Saif Ul
 *         email:
 *           type: string
 *           format: email
 *           example: saif@example.com
 *         role:
 *           type: string
 *           example: service_provider
 *         isBlocked:
 *           type: boolean
 *           example: false
 *         transactionId:
 *           type: string
 *           nullable: true
 *           example: sub_123456
 *         customerId:
 *           type: string
 *           nullable: true
 *           example: cus_123456
 *         plan:
 *           type: string
 *           example: service_provider_plan
 *         planValidity:
 *           type: string
 *           example: monthly
 *         amountPaid:
 *           type: number
 *           example: 500
 *         currency:
 *           type: string
 *           example: GBP
 *         subscriptionStatus:
 *           type: string
 *           example: subscribed
 *         paymentStatus:
 *           type: string
 *           example: paid
 *         accessStatus:
 *           type: string
 *           example: paid
 *         activatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         paidAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AdminSubscriptionListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 2
 *             totalPages:
 *               type: integer
 *               example: 1
 *             hasNextPage:
 *               type: boolean
 *               example: false
 *             hasPrevPage:
 *               type: boolean
 *               example: false
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminSubscriptionListItem'
 *       example:
 *         success: true
 *         meta:
 *           page: 1
 *           limit: 10
 *           total: 2
 *           totalPages: 1
 *           hasNextPage: false
 *           hasPrevPage: false
 *         data:
 *           - id: 6807f0c6c1b2f4a9d9123456
 *             userId: 6807f0c6c1b2f4a9d9123456
 *             fullName: Saif Ul
 *             email: saif@example.com
 *             role: service_provider
 *             isBlocked: false
 *             transactionId: sub_123456
 *             customerId: cus_123456
 *             plan: service_provider_plan
 *             planValidity: monthly
 *             amountPaid: 500
 *             currency: GBP
 *             subscriptionStatus: subscribed
 *             paymentStatus: paid
 *             accessStatus: paid
 *             activatedAt: '2026-04-20T08:10:15.000Z'
 *             paidAt: '2026-04-20T08:10:15.000Z'
 *             expiryDate: '2026-05-20T08:10:15.000Z'
 *             createdAt: '2026-04-20T08:00:00.000Z'
 *             updatedAt: '2026-04-22T10:30:00.000Z'
 *           - id: 6807f0c6c1b2f4a9d9123457
 *             userId: 6807f0c6c1b2f4a9d9123457
 *             fullName: Nadia Rahman
 *             email: nadia@example.com
 *             role: venue_provider
 *             isBlocked: false
 *             transactionId: null
 *             customerId: null
 *             plan: venue_provider_plan
 *             planValidity: yearly
 *             amountPaid: 50000
 *             currency: GBP
 *             subscriptionStatus: not_subscribed
 *             paymentStatus: unpaid
 *             accessStatus: expired
 *             activatedAt: null
 *             paidAt: null
 *             expiryDate: null
 *             createdAt: '2026-04-19T14:20:00.000Z'
 *             updatedAt: '2026-04-19T14:20:00.000Z'
 *     AdminSubscriptionDetailsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: 6807f0c6c1b2f4a9d9123456
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 6807f0c6c1b2f4a9d9123456
 *                 fullName:
 *                   type: string
 *                   example: Saif Ul
 *                 email:
 *                   type: string
 *                   example: saif@example.com
 *                 role:
 *                   type: string
 *                   example: service_provider
 *                 isBlocked:
 *                   type: boolean
 *                   example: false
 *             subscription:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                   nullable: true
 *                   example: sub_123456
 *                 customerId:
 *                   type: string
 *                   nullable: true
 *                   example: cus_123456
 *                 plan:
 *                   type: string
 *                   example: service_provider_plan
 *                 planValidity:
 *                   type: string
 *                   example: monthly
 *                 amountPaid:
 *                   type: number
 *                   example: 500
 *                 currency:
 *                   type: string
 *                   example: GBP
 *                 subscriptionStatus:
 *                   type: string
 *                   example: subscribed
 *                 paymentStatus:
 *                   type: string
 *                   example: paid
 *                 accessStatus:
 *                   type: string
 *                   example: paid
 *                 activatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 expiryDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *             transactionDetails:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                   nullable: true
 *                   example: sub_123456
 *                 plan:
 *                   type: string
 *                   example: service_provider_plan
 *                 userRole:
 *                   type: string
 *                   example: service_provider
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 name:
 *                   type: string
 *                   example: Saif Ul
 *                 accountNumberMasked:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 email:
 *                   type: string
 *                   example: saif@example.com
 *                 transactionAmount:
 *                   type: number
 *                   example: 500
 *                 currency:
 *                   type: string
 *                   example: GBP
 *                 status:
 *                   type: string
 *                   example: paid
 *                 expiryDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 planValidity:
 *                   type: string
 *                   example: monthly
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *       example:
 *         success: true
 *         data:
 *           id: 6807f0c6c1b2f4a9d9123456
 *           user:
 *             id: 6807f0c6c1b2f4a9d9123456
 *             fullName: Saif Ul
 *             email: saif@example.com
 *             role: service_provider
 *             isBlocked: false
 *           subscription:
 *             transactionId: sub_123456
 *             customerId: cus_123456
 *             plan: service_provider_plan
 *             planValidity: monthly
 *             amountPaid: 500
 *             currency: GBP
 *             subscriptionStatus: subscribed
 *             paymentStatus: paid
 *             accessStatus: paid
 *             activatedAt: '2026-04-20T08:10:15.000Z'
 *             paidAt: '2026-04-20T08:10:15.000Z'
 *             expiryDate: '2026-05-20T08:10:15.000Z'
 *           transactionDetails:
 *             transactionId: sub_123456
 *             plan: service_provider_plan
 *             userRole: service_provider
 *             date: '2026-04-20T08:10:15.000Z'
 *             name: Saif Ul
 *             accountNumberMasked: null
 *             email: saif@example.com
 *             transactionAmount: 500
 *             currency: GBP
 *             status: paid
 *             expiryDate: '2026-05-20T08:10:15.000Z'
 *             planValidity: monthly
 *           createdAt: '2026-04-20T08:00:00.000Z'
 *           updatedAt: '2026-04-22T10:30:00.000Z'
 */

/**
 * @openapi
 * /api/v1/admin/profile:
 *   get:
 *     tags: [Admin]
 *     summary: Get authenticated admin profile
 *     description: Returns the profile of the authenticated `admin` or `super_admin`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminSelfProfileResponse'
 *   patch:
 *     tags: [Admin]
 *     summary: Update authenticated admin profile
 *     description: Allows only `admin` to update `fullName` and `phoneNumber`. `super_admin` is forbidden. Email cannot be changed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUpdateProfileResponse'
 *       403:
 *         description: Forbidden
 */
router.get('/profile', AdminManagementController.getMyProfile);
router.patch(
  '/profile',
  authorize('admin'),
  validate(updateAdminProfileSchema),
  AdminManagementController.updateMyProfile
);

/**
 * @openapi
 * /api/v1/admin/change-password:
 *   patch:
 *     tags: [Admin]
 *     summary: Change authenticated admin password
 *     description: Allows authenticated `admin` and `super_admin` users to change their own password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminChangePasswordResponse'
 *       400:
 *         description: Current password is incorrect or new password matches current password
 */
router.patch('/change-password', validate(changeAdminPasswordSchema), AdminManagementController.changeMyPassword);

/**
 * @openapi
 * /api/v1/admin/recent-registered-users:
 *   get:
 *     tags: [Admin]
 *     summary: Get the 5 most recently registered non-admin users
 *     description: Returns the latest 5 registered users excluding `admin` and `super_admin`, with their available profile, subscription, onboarding, and registration metadata.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent registered users returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRecentRegisteredUsersResponse'
 */
router.get('/recent-registered-users', AdminManagementController.getRecentRegisteredUsers);

/**
 * @openapi
 * /api/v1/admin/analytics/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard analytics overview
 *     description: Returns total revenue, total users by role, and current-month new user counts. Available to admin and super_admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAnalyticsOverviewResponse'
 */
router.get('/analytics/overview', AdminManagementController.getAnalyticsOverview);

/**
 * @openapi
 * /api/v1/admin/analytics/yearly:
 *   get:
 *     tags: [Admin]
 *     summary: Get monthly revenue and user growth for a year
 *     description: Returns monthly revenue and new-user counts for the selected year. Available to admin and super_admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2024
 *     responses:
 *       200:
 *         description: Yearly analytics returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminYearlyAnalyticsResponse'
 */
router.get('/analytics/yearly', validate(analyticsYearQuerySchema), AdminManagementController.getYearlyAnalytics);

/**
 * @openapi
 * /api/v1/admin/admin-users:
 *   post:
 *     tags: [Admin]
 *     summary: Create an admin user
 *     description: Only super_admin can create admin users.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       403:
 *         description: Forbidden
 */
router.post('/admin-users', authorize('super_admin'), validate(createAdminSchema), AdminManagementController.createAdmin);

/**
 * @openapi
 * /api/v1/admin/admin-users/{adminUserId}/block:
 *   patch:
 *     tags: [Admin]
 *     summary: Block an admin user
 *     description: Only super_admin can block admin users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin blocked successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.patch(
  '/admin-users/:adminUserId/block',
  authorize('super_admin'),
  validate(adminUserIdParamSchema),
  AdminManagementController.blockAdmin
);

/**
 * @openapi
 * /api/v1/admin/admin-users/{adminUserId}/unblock:
 *   patch:
 *     tags: [Admin]
 *     summary: Unblock an admin user
 *     description: Only super_admin can unblock admin users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin unblocked successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.patch(
  '/admin-users/:adminUserId/unblock',
  authorize('super_admin'),
  validate(adminUserIdParamSchema),
  AdminManagementController.unblockAdmin
);

/**
 * @openapi
 * /api/v1/admin/subscriptions:
 *   get:
 *     tags: [Admin]
 *     summary: Get paginated subscription management list
 *     description: Returns paginated subscription records for users who have an active or historical paid subscription reference.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated subscription list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminSubscriptionListResponse'
 */
router.get('/subscriptions', validate(approvalRequestsQuerySchema), AdminManagementController.getSubscriptionUsers);

/**
 * @openapi
 * /api/v1/admin/subscriptions/{subscriptionUserId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one user's subscription transaction details
 *     description: Returns subscription, payment, expiry, and transaction-oriented details for a specific subscribed user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminSubscriptionDetailsResponse'
 *       404:
 *         description: Subscription record not found
 */
router.get(
  '/subscriptions/:subscriptionUserId',
  validate(subscriptionUserIdParamSchema),
  AdminManagementController.getSubscriptionUserById
);

/**
 * @openapi
 * /api/v1/admin/customers:
 *   get:
 *     tags: [Admin]
 *     summary: Get all customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated customer list
 */
router.get('/customers', validate(approvalRequestsQuerySchema), AdminManagementController.getCustomers);

/**
 * @openapi
 * /api/v1/admin/customers/blocked:
 *   get:
 *     tags: [Admin]
 *     summary: Get blocked customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated blocked customer list
 */
router.get('/customers/blocked', validate(approvalRequestsQuerySchema), AdminManagementController.getBlockedCustomers);

/**
 * @openapi
 * /api/v1/admin/customers/{customerId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one customer by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get('/customers/:customerId', validate(customerIdParamSchema), AdminManagementController.getCustomerById);

/**
 * @openapi
 * /api/v1/admin/customers/{customerId}/block:
 *   patch:
 *     tags: [Admin]
 *     summary: Block a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer blocked successfully
 *       404:
 *         description: Customer not found
 */
router.patch('/customers/:customerId/block', validate(customerIdParamSchema), AdminManagementController.blockCustomer);

/**
 * @openapi
 * /api/v1/admin/customers/{customerId}/unblock:
 *   patch:
 *     tags: [Admin]
 *     summary: Unblock a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer unblocked successfully
 *       404:
 *         description: Customer not found
 */
router.patch('/customers/:customerId/unblock', validate(customerIdParamSchema), AdminManagementController.unblockCustomer);

/**
 * @openapi
 * /api/v1/admin/service-providers:
 *   get:
 *     tags: [Admin]
 *     summary: Get all service providers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated service provider list
 */
router.get(
  '/service-providers',
  validate(approvalRequestsQuerySchema),
  AdminManagementController.getServiceProviders
);

/**
 * @openapi
 * /api/v1/admin/service-providers/blocked:
 *   get:
 *     tags: [Admin]
 *     summary: Get blocked service providers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated blocked service provider list
 */
router.get(
  '/service-providers/blocked',
  validate(approvalRequestsQuerySchema),
  AdminManagementController.getBlockedServiceProviders
);

/**
 * @openapi
 * /api/v1/admin/service-providers/{serviceProviderId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one service provider by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceProviderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service provider details
 *       404:
 *         description: Service provider not found
 */
router.get(
  '/service-providers/:serviceProviderId',
  validate(serviceProviderUserIdParamSchema),
  AdminManagementController.getServiceProviderById
);

/**
 * @openapi
 * /api/v1/admin/service-providers/{serviceProviderId}/block:
 *   patch:
 *     tags: [Admin]
 *     summary: Block a service provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceProviderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service provider blocked successfully
 *       404:
 *         description: Service provider not found
 */
router.patch(
  '/service-providers/:serviceProviderId/block',
  validate(serviceProviderUserIdParamSchema),
  AdminManagementController.blockServiceProvider
);

/**
 * @openapi
 * /api/v1/admin/service-providers/{serviceProviderId}/unblock:
 *   patch:
 *     tags: [Admin]
 *     summary: Unblock a service provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceProviderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service provider unblocked successfully
 *       404:
 *         description: Service provider not found
 */
router.patch(
  '/service-providers/:serviceProviderId/unblock',
  validate(serviceProviderUserIdParamSchema),
  AdminManagementController.unblockServiceProvider
);

/**
 * @openapi
 * /api/v1/admin/venue-providers:
 *   get:
 *     tags: [Admin]
 *     summary: Get all venue providers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated venue provider list
 */
router.get('/venue-providers', validate(approvalRequestsQuerySchema), AdminManagementController.getVenueProviders);

/**
 * @openapi
 * /api/v1/admin/venue-providers/blocked:
 *   get:
 *     tags: [Admin]
 *     summary: Get blocked venue providers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated blocked venue provider list
 */
router.get(
  '/venue-providers/blocked',
  validate(approvalRequestsQuerySchema),
  AdminManagementController.getBlockedVenueProviders
);

/**
 * @openapi
 * /api/v1/admin/venue-providers/{venueProviderId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one venue provider by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueProviderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue provider details
 *       404:
 *         description: Venue provider not found
 */
router.get(
  '/venue-providers/:venueProviderId',
  validate(venueProviderUserIdParamSchema),
  AdminManagementController.getVenueProviderById
);

/**
 * @openapi
 * /api/v1/admin/venue-providers/{venueProviderId}/block:
 *   patch:
 *     tags: [Admin]
 *     summary: Block a venue provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueProviderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue provider blocked successfully
 *       404:
 *         description: Venue provider not found
 */
router.patch(
  '/venue-providers/:venueProviderId/block',
  validate(venueProviderUserIdParamSchema),
  AdminManagementController.blockVenueProvider
);

/**
 * @openapi
 * /api/v1/admin/venue-providers/{venueProviderId}/unblock:
 *   patch:
 *     tags: [Admin]
 *     summary: Unblock a venue provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueProviderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue provider unblocked successfully
 *       404:
 *         description: Venue provider not found
 */
router.patch(
  '/venue-providers/:venueProviderId/unblock',
  validate(venueProviderUserIdParamSchema),
  AdminManagementController.unblockVenueProvider
);

/**
 * @openapi
 * /api/v1/admin/event-planners:
 *   get:
 *     tags: [Admin]
 *     summary: Get all event planners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated event planner list
 */
router.get('/event-planners', validate(approvalRequestsQuerySchema), AdminManagementController.getEventPlanners);

/**
 * @openapi
 * /api/v1/admin/event-planners/blocked:
 *   get:
 *     tags: [Admin]
 *     summary: Get blocked event planners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated blocked event planner list
 */
router.get(
  '/event-planners/blocked',
  validate(approvalRequestsQuerySchema),
  AdminManagementController.getBlockedEventPlanners
);

/**
 * @openapi
 * /api/v1/admin/event-planners/{eventPlannerId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one event planner by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventPlannerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event planner details
 *       404:
 *         description: Event planner not found
 */
router.get(
  '/event-planners/:eventPlannerId',
  validate(eventPlannerUserIdParamSchema),
  AdminManagementController.getEventPlannerById
);

/**
 * @openapi
 * /api/v1/admin/event-planners/{eventPlannerId}/block:
 *   patch:
 *     tags: [Admin]
 *     summary: Block an event planner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventPlannerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event planner blocked successfully
 *       404:
 *         description: Event planner not found
 */
router.patch(
  '/event-planners/:eventPlannerId/block',
  validate(eventPlannerUserIdParamSchema),
  AdminManagementController.blockEventPlanner
);

/**
 * @openapi
 * /api/v1/admin/event-planners/{eventPlannerId}/unblock:
 *   patch:
 *     tags: [Admin]
 *     summary: Unblock an event planner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventPlannerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event planner unblocked successfully
 *       404:
 *         description: Event planner not found
 */
router.patch(
  '/event-planners/:eventPlannerId/unblock',
  validate(eventPlannerUserIdParamSchema),
  AdminManagementController.unblockEventPlanner
);

/**
 * @openapi
 * /api/v1/admin/venues:
 *   get:
 *     tags: [Admin]
 *     summary: Get all venues for admin moderation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated venues including pending, published, and rejected items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPendingVenueListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/venues', validate(approvalRequestsQuerySchema), AdminManagementController.getAllVenues);

/**
 * @openapi
 * /api/v1/admin/venues/{venueId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one venue for admin moderation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single venue including owner information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
 */
router.get('/venues/:venueId', validate(venueIdParamSchema), AdminManagementController.getVenueById);

/**
 * @openapi
 * /api/v1/admin/services:
 *   get:
 *     tags: [Admin]
 *     summary: Get all services for admin moderation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated services including pending, published, and rejected items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPendingServiceListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/services', validate(approvalRequestsQuerySchema), AdminManagementController.getAllServices);

/**
 * @openapi
 * /api/v1/admin/services/{serviceId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get one service for admin moderation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single service including owner information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 */
router.get('/services/:serviceId', validate(serviceIdParamSchema), AdminManagementController.getServiceById);

/**
 * @openapi
 * /api/v1/admin/venues/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Get pending venue approval requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated pending venue approval requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPendingVenueListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/venues/pending', validate(approvalRequestsQuerySchema), AdminManagementController.getPendingVenues);

/**
 * @openapi
 * /api/v1/admin/services/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Get pending service approval requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated pending service approval requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPendingServiceListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/services/pending', validate(approvalRequestsQuerySchema), AdminManagementController.getPendingServices);

/**
 * @openapi
 * /api/v1/admin/venues/{venueId}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve venue and publish it
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         example: 65f1a9d0f1b2c3d4e5f60718
 *     responses:
 *       200:
 *         description: Venue approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
 */
router.patch('/venues/:venueId/approve', validate(venueIdParamSchema), AdminManagementController.approveVenue);

/**
 * @openapi
 * /api/v1/admin/venues/{venueId}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject venue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
 */
router.patch('/venues/:venueId/reject', validate(venueIdParamSchema), AdminManagementController.rejectVenue);

/**
 * @openapi
 * /api/v1/admin/services/{serviceId}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve service and publish it
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 */
router.patch(
  '/services/:serviceId/approve',
  validate(serviceIdParamSchema),
  AdminManagementController.approveService
);

/**
 * @openapi
 * /api/v1/admin/services/{serviceId}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 */
router.patch(
  '/services/:serviceId/reject',
  validate(serviceIdParamSchema),
  AdminManagementController.rejectService
);

export const adminManagementRouter = router;
