import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { NotificationController } from './notification.controller';
import {
  emptyNotificationBodySchema,
  notificationIdParamSchema,
  notificationListQuerySchema
} from './notification.schema';

const router = Router();

router.use(protect);

/**
 * @openapi
 * tags:
 *   - name: Notifications
 *     description: In-app notification feed for all authenticated roles
 * components:
 *   schemas:
 *     NotificationEntity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680000000000000000000501
 *         recipientId:
 *           type: string
 *           example: 680000000000000000000101
 *         category:
 *           type: string
 *           enum: [admin, booking, subscription, message]
 *           example: booking
 *         type:
 *           type: string
 *           enum:
 *             - venue_request_created
 *             - service_request_created
 *             - venue_request_decision
 *             - service_request_decision
 *             - booking_request_created
 *             - booking_status_changed
 *             - booking_reminder
 *             - subscription_expiring
 *             - chat_message
 *           example: booking_status_changed
 *         title:
 *           type: string
 *           example: Booking accepted
 *         message:
 *           type: string
 *           example: Provider accepted your booking for Premium Catering on 2026-04-25.
 *         actionEndpoint:
 *           type: string
 *           example: /api/v1/bookings/680000000000000000000401
 *         entityType:
 *           type: string
 *           nullable: true
 *           example: booking
 *         entityId:
 *           type: string
 *           nullable: true
 *           example: 680000000000000000000401
 *         metadata:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *         isRead:
 *           type: boolean
 *           example: false
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     NotificationListResponse:
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
 *             $ref: '#/components/schemas/NotificationEntity'
 *     NotificationUnreadCountResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             unreadCount:
 *               type: integer
 *               example: 4
 *     NotificationSingleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Notification marked as read
 *         data:
 *           $ref: '#/components/schemas/NotificationEntity'
 *     NotificationMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: All notifications marked as read
 *
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get the authenticated user's notifications
 *     security:
 *       - bearerAuth: []
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
 *           example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [admin, booking, subscription, message]
 *     responses:
 *       200:
 *         description: Notification feed returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationUnreadCountResponse'
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationMessageResponse'
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/notifications/{notificationId}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark one notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationSingleResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.get('/', validate(notificationListQuerySchema), NotificationController.getMyNotifications);
router.get('/unread-count', validate(emptyNotificationBodySchema), NotificationController.getUnreadCount);
router.patch('/read-all', validate(emptyNotificationBodySchema), NotificationController.markAllAsRead);
router.patch('/:notificationId/read', validate(notificationIdParamSchema), NotificationController.markAsRead);

export const notificationRouter = router;
