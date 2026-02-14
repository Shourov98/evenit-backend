import { Router } from 'express';
import { EventPlannerController } from './event-planner.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/event-planners:
 *   get:
 *     tags: [EventPlanner]
 *     summary: Get all event planners (public)
 */
router.get('/', EventPlannerController.getAll);

export const eventPlannerRouter = router;
