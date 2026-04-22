import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { EventPlannerController } from './event-planner.controller';
import {
  eventPlannerAvailabilityQuerySchema,
  updateEventPlannerAvailabilitySchema
} from './event-planner.schema';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     EventPlannerDashboardAnalytics:
 *       type: object
 *       properties:
 *         totalEvents:
 *           type: integer
 *           example: 24
 *         upcomingBookings:
 *           type: integer
 *           example: 47
 *         monthlyRevenue:
 *           type: number
 *           example: 18420
 *         currency:
 *           type: string
 *           example: GBP
 *         averageRating:
 *           type: number
 *           example: 4.8
 *         totalReviews:
 *           type: integer
 *           example: 18
 *         month:
 *           type: string
 *           example: 2026-04
 *     EventPlannerDashboardAnalyticsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/EventPlannerDashboardAnalytics'
 *       example:
 *         success: true
 *         data:
 *           totalEvents: 24
 *           upcomingBookings: 47
 *           monthlyRevenue: 18420
 *           currency: GBP
 *           averageRating: 4.8
 *           totalReviews: 18
 *           month: 2026-04
 *
 * /api/v1/event-planners/me/analytics:
 *   get:
 *     tags: [EventPlanner]
 *     summary: Get event planner dashboard analytics
 *     description: Returns the event planner dashboard card metrics including total events, upcoming bookings, current month revenue, and average rating.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventPlannerDashboardAnalyticsResponse'
 *
 * /api/v1/event-planners/me/availability:
 *   get:
 *     tags: [EventPlanner]
 *     summary: Get the authenticated event planner availability calendar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: 2026-04
 *     responses:
 *       200:
 *         description: Event planner availability returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only event planners can access this endpoint
 *   patch:
 *     tags: [EventPlanner]
 *     summary: Block event planner availability for a full day
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-04-18
 *     responses:
 *       200:
 *         description: Availability blocked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only event planners can access this endpoint
 *   delete:
 *     tags: [EventPlanner]
 *     summary: Unblock event planner availability for a full day
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-04-18
 *     responses:
 *       200:
 *         description: Availability unblocked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only event planners can access this endpoint
 */
router.get(
  '/me/analytics',
  protect,
  authorize('event_planner'),
  EventPlannerController.getMyDashboardAnalytics
);

router.get(
  '/me/availability',
  protect,
  authorize('event_planner'),
  validate(eventPlannerAvailabilityQuerySchema),
  EventPlannerController.getMyAvailability
);

router.patch(
  '/me/availability',
  protect,
  authorize('event_planner'),
  validate(updateEventPlannerAvailabilitySchema),
  EventPlannerController.blockMyAvailability
);

router.delete(
  '/me/availability',
  protect,
  authorize('event_planner'),
  validate(updateEventPlannerAvailabilitySchema),
  EventPlannerController.unblockMyAvailability
);

/**
 * @openapi
 * tags:
 *   - name: EventPlanner
 *     description: Public listing of verified event providers
 * components:
 *   schemas:
 *     EventPlannerEntity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f1a9d0f1b2c3d4e5f60077
 *         fullName:
 *           type: string
 *           example: Premium Wedding & Event Planner
 *         email:
 *           type: string
 *           format: email
 *           example: planner@example.com
 *         role:
 *           type: string
 *           example: event_planner
 *         serviceCategories:
 *           type: array
 *           items:
 *             type: string
 *         isEmailVerified:
 *           type: boolean
 *           example: true
 *         onboarding:
 *           nullable: true
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     EventPlannerListResponse:
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
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventPlannerEntity'
 */

/**
 * @openapi
 * /api/v1/event-planners:
 *   get:
 *     tags: [EventPlanner]
 *     summary: Get all event planners (public)
 *     description: Returns verified users whose role is `event_planner`.
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
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated event planner list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventPlannerListResponse'
 */
router.get('/', EventPlannerController.getAll);

/**
 * @openapi
 * /api/v1/event-planners/{eventPlannerId}:
 *   get:
 *     tags: [EventPlanner]
 *     summary: Get one event planner by id
 *     description: Returns one verified public event planner profile.
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
router.get('/:eventPlannerId', EventPlannerController.getById);

export const eventPlannerRouter = router;
