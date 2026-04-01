import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { UsersController } from './users.controller';
import { createUsersSchema, getUserProfileSchema } from './users.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User profile endpoints
 * components:
 *   schemas:
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: User profile retrieved successfully
 *         data:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             role:
 *               type: string
 *               enum: [customer, service_provider, event_planner, venue_provider, admin, super_admin]
 *             serviceCategories:
 *               type: array
 *               items:
 *                 type: string
 *             isEmailVerified:
 *               type: boolean
 *             isBlocked:
 *               type: boolean
 *             profileImage:
 *               nullable: true
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                 publicId:
 *                   type: string
 *             subscription:
 *               type: object
 *             onboarding:
 *               nullable: true
 *               type: object
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *
 * @openapi
 * /api/v1/users/{userId}/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get full profile information for any user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 65f1a9d0f1b2c3d4e5f60001
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       400:
 *         description: Invalid userId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/', validate(createUsersSchema), UsersController.create);
router.get('/', UsersController.getAll);
router.get('/:userId/profile', protect, validate(getUserProfileSchema), UsersController.getProfile);

export const usersRouter = router;
