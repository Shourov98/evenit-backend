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
 * tags:
 *   - name: Reviews
 *     description: Ratings and review APIs for completed bookings
 * components:
 *   schemas:
 *     ReviewCustomerSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680000000000000000000701
 *         fullName:
 *           type: string
 *           example: Sarah Ahmed
 *         profileImage:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/profiles/sarah.jpg
 *     ReviewProviderSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680000000000000000000702
 *         fullName:
 *           type: string
 *           example: Premium Catering Ltd
 *         profileImage:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/providers/catering.jpg
 *     ReviewEntity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680000000000000000000703
 *         bookingId:
 *           type: string
 *           example: 680000000000000000000401
 *         customerId:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/ReviewCustomerSummary'
 *         providerId:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/ReviewProviderSummary'
 *         targetType:
 *           type: string
 *           enum: [venue, service, event]
 *           example: venue
 *         targetId:
 *           type: string
 *           example: 680000000000000000000102
 *         rating:
 *           type: integer
 *           example: 5
 *         comment:
 *           type: string
 *           example: Spacious venue, helpful staff, and smooth booking experience.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-21T11:30:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-21T11:30:00.000Z
 *     ReviewListResponse:
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
 *               example: 2
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
 *             $ref: '#/components/schemas/ReviewEntity'
 *
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
 *     responses:
 *       200:
 *         description: Paginated reviews submitted by the authenticated customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 *             example:
 *               success: true
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 1
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               data:
 *                 - _id: 680000000000000000000703
 *                   bookingId: 680000000000000000000401
 *                   customerId: 680000000000000000000101
 *                   providerId:
 *                     _id: 680000000000000000000702
 *                     fullName: Premium Catering Ltd
 *                     profileImage: https://cdn.example.com/providers/catering.jpg
 *                   targetType: service
 *                   targetId: 680000000000000000000202
 *                   rating: 5
 *                   comment: The catering quality and delivery timing were excellent.
 *                   createdAt: 2026-04-21T11:30:00.000Z
 *                   updatedAt: 2026-04-21T11:30:00.000Z
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
 *     parameters:
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated reviews for a specific target
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 *             example:
 *               success: true
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 2
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               data:
 *                 - _id: 680000000000000000000704
 *                   bookingId: 680000000000000000000402
 *                   customerId:
 *                     _id: 680000000000000000000701
 *                     fullName: Sarah Ahmed
 *                     profileImage: https://cdn.example.com/profiles/sarah.jpg
 *                   providerId: 680000000000000000000303
 *                   targetType: venue
 *                   targetId: 680000000000000000000102
 *                   rating: 5
 *                   comment: Spacious venue, helpful staff, and great location.
 *                   createdAt: 2026-04-21T12:00:00.000Z
 *                   updatedAt: 2026-04-21T12:00:00.000Z
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
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated reviews for a specific provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 *             example:
 *               success: true
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 2
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               data:
 *                 - _id: 680000000000000000000705
 *                   bookingId: 680000000000000000000403
 *                   customerId:
 *                     _id: 680000000000000000000701
 *                     fullName: Sarah Ahmed
 *                     profileImage: https://cdn.example.com/profiles/sarah.jpg
 *                   providerId: 680000000000000000000702
 *                   targetType: service
 *                   targetId: 680000000000000000000202
 *                   rating: 4
 *                   comment: Professional team and responsive communication.
 *                   createdAt: 2026-04-21T12:30:00.000Z
 *                   updatedAt: 2026-04-21T12:30:00.000Z
 */
router.get(
  '/provider/:providerId',
  validate(getProviderReviewsSchema),
  ReviewController.getReviewsByProvider
);

export const reviewRouter = router;
