import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { BookingController } from './booking.controller';
import {
  bookingIdParamSchema,
  createBookingSchema,
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
 *         - timeSlots
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
 *         timeSlots:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             example: "14:00"
 *           example: ["14:00", "15:00", "16:00"]
 *         durationHours:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           example: 3
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
 *         timeSlots:
 *           type: array
 *           items:
 *             type: string
 *           example: ["14:00", "15:00", "16:00"]
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
 *     description: Creates a customer booking for a venue or service. Event bookings are currently blocked by the backend.
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
 *     responses:
 *       200:
 *         description: Customer bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get('/my', authorize('customer'), BookingController.getMyBookings);

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
 *     responses:
 *       200:
 *         description: Provider bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 */
router.get('/provider', authorize('venue_provider', 'service_provider', 'event_planner'), BookingController.getProviderBookings);

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
