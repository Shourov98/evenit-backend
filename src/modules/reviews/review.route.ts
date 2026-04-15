import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { ReviewController } from './review.controller';
import {
  createReviewSchema,
  getProviderReviewsSchema,
  getReviewsQuerySchema,
  getTargetReviewsSchema
} from './review.schema';

const router = Router();

/**
 * @openapi
 * /api/v1/reviews/{bookingId}:
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a review and rating for a completed booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post(
  '/:bookingId',
  protect,
  validate(createReviewSchema),
  ReviewController.createReview
);

/**
 * @openapi
 * /api/v1/reviews/my:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews submitted by the current authenticated user
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my',
  protect,
  validate(getReviewsQuerySchema),
  ReviewController.getMyReviews
);

/**
 * @openapi
 * /api/v1/reviews/target/{targetId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a specific venue, service, or event planner
 */
router.get(
  '/target/:targetId',
  validate(getTargetReviewsSchema),
  ReviewController.getReviewsByTarget
);

/**
 * @openapi
 * /api/v1/reviews/provider/{providerId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a specific provider
 */
router.get(
  '/provider/:providerId',
  validate(getProviderReviewsSchema),
  ReviewController.getReviewsByProvider
);

export const reviewRouter = router;
