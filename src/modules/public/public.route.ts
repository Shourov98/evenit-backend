import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware';
import { PublicController } from './public.controller';
import { eventPlannerIdParamSchema, serviceIdParamSchema, venueIdParamSchema } from './public.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Public
 *     description: Public landing-page content endpoints
 * components:
 *   schemas:
 *     PublicServiceListResponse:
 *       $ref: '#/components/schemas/ServiceListResponse'
 *     PublicVenueListResponse:
 *       $ref: '#/components/schemas/VenueListResponse'
 *     PublicEventPlannerListResponse:
 *       $ref: '#/components/schemas/EventPlannerListResponse'
 */

/**
 * @openapi
 * /api/v1/public/services:
 *   get:
 *     tags: [Public]
 *     summary: Get published services without authentication
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
 *         description: Paginated published services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicServiceListResponse'
 */
router.get('/services', PublicController.getPublishedServices);

/**
 * @openapi
 * /api/v1/public/services/{serviceId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one published service without authentication
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published service details
 *       404:
 *         description: Service not found
 */
router.get('/services/:serviceId', validate(serviceIdParamSchema), PublicController.getPublishedServiceById);

/**
 * @openapi
 * /api/v1/public/venues:
 *   get:
 *     tags: [Public]
 *     summary: Get published venues without authentication
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
 *         description: Paginated published venues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicVenueListResponse'
 */
router.get('/venues', PublicController.getPublishedVenues);

/**
 * @openapi
 * /api/v1/public/venues/{venueId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one published venue without authentication
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published venue details
 *       404:
 *         description: Venue not found
 */
router.get('/venues/:venueId', validate(venueIdParamSchema), PublicController.getPublishedVenueById);

/**
 * @openapi
 * /api/v1/public/event-planners:
 *   get:
 *     tags: [Public]
 *     summary: Get public event planners without authentication
 *     description: Returns verified event planners who completed event planner onboarding.
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
 *         description: Paginated event planners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicEventPlannerListResponse'
 */
router.get('/event-planners', PublicController.getPublishedEventPlanners);

/**
 * @openapi
 * /api/v1/public/event-planners/{eventPlannerId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one event planner without authentication
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
  validate(eventPlannerIdParamSchema),
  PublicController.getPublishedEventPlannerById
);

export const publicRouter = router;
