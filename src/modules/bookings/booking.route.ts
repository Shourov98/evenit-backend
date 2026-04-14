import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { BookingController } from './booking.controller';
import {
  bookingIdParamSchema,
  bookingListQuerySchema,
  createEventPlannerBookingSchema,
  createBookingSchema,
  createServiceBookingSchema,
  createVenueBookingSchema,
  rejectBookingSchema
} from './booking.schema';

const router = Router();

router.use(protect);

/**
 * @openapi
 * tags:
 *   - name: Bookings
 *     description: Customer and provider booking lifecycle
 * components:
 *   schemas:
 *     BookingCreateRequest:
 *       type: object
 *       required:
 *         - targetType
 *         - targetId
 *         - bookingDate
 *         - hours
 *       properties:
 *         targetType:
 *           type: string
 *           enum: [venue, service, event]
 *           example: venue
 *         targetId:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60718
 *         bookingDate:
 *           type: string
 *           format: date
 *           example: 2026-03-20
 *         hours:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: integer
 *             example: 14
 *           example: [14, 15, 16]
 *         guest_count:
 *           type: integer
 *           minimum: 1
 *           example: 250
 *         location:
 *           type: string
 *           example: Farmgate, Dhaka
 *         specialInstructions:
 *           type: string
 *           example: Need stage lighting and extra chairs.
 *     BookingRejectRequest:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           example: Selected slots are unavailable due to maintenance.
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60799
 *         customerId:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60001
 *         providerId:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60002
 *         targetType:
 *           type: string
 *           enum: [venue, service, event]
 *           example: venue
 *         targetId:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60718
 *         bookingDate:
 *           type: string
 *           format: date
 *           example: 2026-03-20
 *         hours:
 *           type: array
 *           items:
 *             type: integer
 *           example: [14, 15, 16]
 *         guest_count:
 *           type: integer
 *           nullable: true
 *           example: 250
 *         durationHours:
 *           type: integer
 *           example: 3
 *         location:
 *           type: string
 *           example: Farmgate, Dhaka
 *         specialInstructions:
 *           type: string
 *           example: Need stage lighting and extra chairs.
 *         pricing:
 *           type: object
 *           properties:
 *             unitAmount:
 *               type: number
 *               example: 5000
 *             subtotal:
 *               type: number
 *               example: 15000
 *             taxAmount:
 *               type: number
 *               example: 0
 *             platformFeeAmount:
 *               type: number
 *               example: 1500
 *             totalAmount:
 *               type: number
 *               example: 15000
 *             currency:
 *               type: string
 *               example: BDT
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, confirmed, cancelled, completed]
 *           example: pending
 *         payment:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [covered_by_subscription]
 *               example: covered_by_subscription
 *             coveredAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         rejectedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     BookingListResponse:
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
 *               example: 1
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
 *             $ref: '#/components/schemas/Booking'
 *     BookingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Booking created successfully
 *         data:
 *           $ref: '#/components/schemas/Booking'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: One or more selected time slots are already booked
 */

/**
 * @openapi
 * /api/v1/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking
 *     description: Creates a customer booking for a venue, service, or event planner.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreateRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Validation failed or unsupported booking target
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only subscribed customers can create bookings
 *       404:
 *         description: Target resource not found
 *       409:
 *         description: Time slot conflict
 */
router.post('/', authorize('customer'), validate(createBookingSchema), BookingController.createBooking);

/**
 * @openapi
 * /api/v1/bookings/services/{serviceId}:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking request for a service
 *     description: Creates a customer booking request for a published service.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingDate, hours]
 *             properties:
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-20
 *               hours:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   example: 14
 *               location:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service booking created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only subscribed customers can create bookings
 *       404:
 *         description: Service not found
 *       409:
 *         description: Hour conflict
 */
router.post(
  '/services/:serviceId',
  authorize('customer'),
  validate(createServiceBookingSchema),
  BookingController.createServiceBooking
);

/**
 * @openapi
 * /api/v1/bookings/venues/{venueId}:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking request for a venue
 *     description: Creates a customer booking request for a published venue.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingDate, hours, guest_count]
 *             properties:
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-20
 *               hours:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   example: 14
 *               guest_count:
 *                 type: integer
 *                 minimum: 1
 *                 example: 250
 *               location:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Venue booking created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only subscribed customers can create bookings
 *       404:
 *         description: Venue not found
 *       409:
 *         description: Hour conflict or guest_count exceeds venue capacity
 */
router.post(
  '/venues/:venueId',
  authorize('customer'),
  validate(createVenueBookingSchema),
  BookingController.createVenueBooking
);

/**
 * @openapi
 * /api/v1/bookings/event-planners/{eventPlannerId}:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking request for an event planner
 *     description: Creates a customer booking request for a verified event planner.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventPlannerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingDate, hours]
 *             properties:
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-20
 *               hours:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   example: 14
 *               location:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event planner booking created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only subscribed customers can create bookings
 *       404:
 *         description: Event planner not found
 *       409:
 *         description: Time slot conflict
 */
router.post(
  '/event-planners/:eventPlannerId',
  authorize('customer'),
  validate(createEventPlannerBookingSchema),
  BookingController.createEventPlannerBooking
);

/**
 * @openapi
 * /api/v1/bookings/my:
 *   get:
 *     tags: [Bookings]
 *     summary: Get customer bookings
 *     description: Returns paginated bookings created by the authenticated customer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, confirmed, cancelled]
 *         description: Filter bookings by status. `approved` also matches confirmed bookings.
 *     responses:
 *       200:
 *         description: Customer bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get('/my', authorize('customer'), validate(bookingListQuerySchema), BookingController.getMyBookings);

/**
 * @openapi
 * /api/v1/bookings/provider:
 *   get:
 *     tags: [Bookings]
 *     summary: Get provider bookings
 *     description: Returns paginated bookings assigned to the authenticated provider.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, confirmed, cancelled]
 *         description: Filter bookings by status. `approved` also matches confirmed bookings.
 *     responses:
 *       200:
 *         description: Provider bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get(
  '/provider',
  authorize('venue_provider', 'service_provider', 'event_planner'),
  validate(bookingListQuerySchema),
  BookingController.getProviderBookings
);

/**
 * @openapi
 * /api/v1/bookings/service-provider:
 *   get:
 *     tags: [Bookings]
 *     summary: Get service provider booking requests
 *     description: Returns paginated bookings assigned to the authenticated service provider.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, confirmed, cancelled]
 *         description: Filter bookings by status. `approved` also matches confirmed bookings.
 *     responses:
 *       200:
 *         description: Service provider bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get(
  '/service-provider',
  authorize('service_provider'),
  validate(bookingListQuerySchema),
  BookingController.getServiceProviderBookings
);

/**
 * @openapi
 * /api/v1/bookings/venue-provider:
 *   get:
 *     tags: [Bookings]
 *     summary: Get venue provider booking requests
 *     description: Returns paginated bookings assigned to the authenticated venue provider.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, confirmed, cancelled]
 *         description: Filter bookings by status. `approved` also matches confirmed bookings.
 *     responses:
 *       200:
 *         description: Venue provider bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get(
  '/venue-provider',
  authorize('venue_provider'),
  validate(bookingListQuerySchema),
  BookingController.getVenueProviderBookings
);

/**
 * @openapi
 * /api/v1/bookings/event-planner:
 *   get:
 *     tags: [Bookings]
 *     summary: Get event planner booking requests
 *     description: Returns paginated bookings assigned to the authenticated event planner.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, confirmed, cancelled]
 *         description: Filter bookings by status. `approved` also matches confirmed bookings.
 *     responses:
 *       200:
 *         description: Event planner bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get(
  '/event-planner',
  authorize('event_planner'),
  validate(bookingListQuerySchema),
  BookingController.getEventPlannerBookings
);

/**
 * @openapi
 * /api/v1/bookings/{bookingId}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get one booking by id
 *     description: Returns a single booking if the current user is the customer, provider, or an admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         example: 65f1a9d0f1b2c3d4e5f60799
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 */
router.get('/:bookingId', validate(bookingIdParamSchema), BookingController.getBookingById);

/**
 * @openapi
 * /api/v1/bookings/{bookingId}/approve:
 *   patch:
 *     tags: [Bookings]
 *     summary: Approve a booking
 *     description: Provider approves a pending booking. Approved bookings are confirmed immediately because bookings are covered by subscription.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Booking is not pending
 *       403:
 *         description: Only the assigned provider can approve
 *       404:
 *         description: Booking not found
 */
router.patch(
  '/:bookingId/approve',
  authorize('venue_provider', 'service_provider', 'event_planner'),
  validate(bookingIdParamSchema),
  BookingController.approveBooking
);

/**
 * @openapi
 * /api/v1/bookings/service-provider/{bookingId}/approve:
 *   patch:
 *     tags: [Bookings]
 *     summary: Approve a booking as service provider
 *     description: Service provider approves a pending booking assigned to them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */
router.patch(
  '/service-provider/:bookingId/approve',
  authorize('service_provider'),
  validate(bookingIdParamSchema),
  BookingController.approveServiceProviderBooking
);

router.patch(
  '/services/:bookingId/accept',
  authorize('service_provider'),
  validate(bookingIdParamSchema),
  BookingController.approveServiceProviderBooking
);

/**
 * @openapi
 * /api/v1/bookings/venue-provider/{bookingId}/approve:
 *   patch:
 *     tags: [Bookings]
 *     summary: Approve a booking as venue provider
 *     description: Venue provider approves a pending booking assigned to them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */
router.patch(
  '/venue-provider/:bookingId/approve',
  authorize('venue_provider'),
  validate(bookingIdParamSchema),
  BookingController.approveVenueProviderBooking
);

router.patch(
  '/venues/:bookingId/accept',
  authorize('venue_provider'),
  validate(bookingIdParamSchema),
  BookingController.approveVenueProviderBooking
);

/**
 * @openapi
 * /api/v1/bookings/event-planner/{bookingId}/approve:
 *   patch:
 *     tags: [Bookings]
 *     summary: Approve a booking as event planner
 *     description: Event planner approves a pending booking assigned to them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */
router.patch(
  '/event-planner/:bookingId/approve',
  authorize('event_planner'),
  validate(bookingIdParamSchema),
  BookingController.approveEventPlannerBooking
);

router.patch(
  '/event-planners/:bookingId/accept',
  authorize('event_planner'),
  validate(bookingIdParamSchema),
  BookingController.approveEventPlannerBooking
);

/**
 * @openapi
 * /api/v1/bookings/{bookingId}/reject:
 *   patch:
 *     tags: [Bookings]
 *     summary: Reject a booking
 *     description: Provider rejects a pending booking and may optionally provide a reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRejectRequest'
 *     responses:
 *       200:
 *         description: Booking rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Booking is not pending
 *       403:
 *         description: Only the assigned provider can reject
 *       404:
 *         description: Booking not found
 */
router.patch(
  '/:bookingId/reject',
  authorize('venue_provider', 'service_provider', 'event_planner'),
  validate(rejectBookingSchema),
  BookingController.rejectBooking
);

/**
 * @openapi
 * /api/v1/bookings/service-provider/{bookingId}/reject:
 *   patch:
 *     tags: [Bookings]
 *     summary: Reject a booking as service provider
 *     description: Service provider rejects a pending booking assigned to them and may optionally provide a reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRejectRequest'
 *     responses:
 *       200:
 *         description: Booking rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */
router.patch(
  '/service-provider/:bookingId/reject',
  authorize('service_provider'),
  validate(rejectBookingSchema),
  BookingController.rejectServiceProviderBooking
);

router.patch(
  '/services/:bookingId/reject',
  authorize('service_provider'),
  validate(rejectBookingSchema),
  BookingController.rejectServiceProviderBooking
);

/**
 * @openapi
 * /api/v1/bookings/venue-provider/{bookingId}/reject:
 *   patch:
 *     tags: [Bookings]
 *     summary: Reject a booking as venue provider
 *     description: Venue provider rejects a pending booking assigned to them and may optionally provide a reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRejectRequest'
 *     responses:
 *       200:
 *         description: Booking rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */
router.patch(
  '/venue-provider/:bookingId/reject',
  authorize('venue_provider'),
  validate(rejectBookingSchema),
  BookingController.rejectVenueProviderBooking
);

router.patch(
  '/venues/:bookingId/reject',
  authorize('venue_provider'),
  validate(rejectBookingSchema),
  BookingController.rejectVenueProviderBooking
);

/**
 * @openapi
 * /api/v1/bookings/event-planner/{bookingId}/reject:
 *   patch:
 *     tags: [Bookings]
 *     summary: Reject a booking as event planner
 *     description: Event planner rejects a pending booking assigned to them and may optionally provide a reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRejectRequest'
 *     responses:
 *       200:
 *         description: Booking rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 */
router.patch(
  '/event-planner/:bookingId/reject',
  authorize('event_planner'),
  validate(rejectBookingSchema),
  BookingController.rejectEventPlannerBooking
);

router.patch(
  '/event-planners/:bookingId/reject',
  authorize('event_planner'),
  validate(rejectBookingSchema),
  BookingController.rejectEventPlannerBooking
);

/**
 * @openapi
 * /api/v1/bookings/{bookingId}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     description: Customer cancels a booking before completion.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Booking cannot be cancelled
 *       403:
 *         description: Only the customer can cancel
 *       404:
 *         description: Booking not found
 */
router.patch('/:bookingId/cancel', authorize('customer'), validate(bookingIdParamSchema), BookingController.cancelBooking);

export const bookingRouter = router;
