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
 *     PublicErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Service not found
 *     PublicServiceListResponse:
 *       $ref: '#/components/schemas/ServiceListResponse'
 *     PublicServiceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ServiceEntity'
 *     PublicVenueListResponse:
 *       $ref: '#/components/schemas/VenueListResponse'
 *     PublicVenueResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/VenueEntity'
 *     PublicEventPlannerListResponse:
 *       $ref: '#/components/schemas/EventPlannerListResponse'
 *     PublicEventPlannerResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/EventPlannerEntity'
 */

/**
 * @openapi
 * /api/v1/public/services:
 *   get:
 *     tags: [Public]
 *     summary: Get published services without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns only services with `publishStatus: published`."
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
 *       400:
 *         description: Invalid pagination or sorting query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
*/
router.get('/services', PublicController.getPublishedServices);

/**
 * @openapi
 * /api/v1/public/services/{serviceId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one published service without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns one published service by id."
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published service details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicServiceResponse'
 *       400:
 *         description: Invalid service id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get('/services/:serviceId', validate(serviceIdParamSchema), PublicController.getPublishedServiceById);

/**
 * @openapi
 * /api/v1/public/venues:
 *   get:
 *     tags: [Public]
 *     summary: Get published venues without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns only venues with `publishStatus: published`."
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
 *       400:
 *         description: Invalid pagination or sorting query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
*/
router.get('/venues', PublicController.getPublishedVenues);

/**
 * @openapi
 * /api/v1/public/venues/{venueId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one published venue without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns one published venue by id."
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published venue details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicVenueResponse'
 *       400:
 *         description: Invalid venue id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 *       404:
 *         description: Venue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get('/venues/:venueId', validate(venueIdParamSchema), PublicController.getPublishedVenueById);

/**
 * @openapi
 * /api/v1/public/event-planners:
 *   get:
 *     tags: [Public]
 *     summary: Get public event planners without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns verified event planners who completed event planner onboarding."
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
 *       400:
 *         description: Invalid pagination or sorting query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
*/
router.get('/event-planners', PublicController.getPublishedEventPlanners);

/**
 * @openapi
 * /api/v1/public/event-planners/{eventPlannerId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one event planner without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns one event planner by id."
 *     parameters:
 *       - in: path
 *         name: eventPlannerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event planner details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicEventPlannerResponse'
 *       400:
 *         description: Invalid event planner id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 *       404:
 *         description: Event planner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get(
  '/event-planners/:eventPlannerId',
  validate(eventPlannerIdParamSchema),
  PublicController.getPublishedEventPlannerById
);

export const publicRouter = router;
