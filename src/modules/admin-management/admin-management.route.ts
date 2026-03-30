import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { AdminManagementController } from './admin-management.controller';
import {
  adminUserIdParamSchema,
  approvalRequestsQuerySchema,
  customerIdParamSchema,
  createAdminSchema,
  serviceIdParamSchema,
  serviceProviderUserIdParamSchema,
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
 */

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
