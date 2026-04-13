import { Router } from 'express';
import { EventPlannerController } from './event-planner.controller';

const router = Router();

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
router.get('/:eventPlannerId', EventPlannerController.getById);

export const eventPlannerRouter = router;
