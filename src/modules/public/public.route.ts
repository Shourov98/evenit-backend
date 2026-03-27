import { Router } from 'express';
import { PublicController } from './public.controller';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Public
 *     description: Public landing-page content endpoints
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
 */
router.get('/services', PublicController.getPublishedServices);

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
 */
router.get('/venues', PublicController.getPublishedVenues);

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
 */
router.get('/event-planners', PublicController.getPublishedEventPlanners);

export const publicRouter = router;
