import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { OrderChatController } from './order-chat.controller';
import {
  orderChatConversationListQuerySchema,
  orderChatMessagesQuerySchema,
  sendOrderChatMessageSchema
} from './order-chat.schema';

const router = Router();

router.use(protect);

/**
 * @openapi
 * tags:
 *   - name: Order Chat
 *     description: Realtime chat between booking customer and provider
 */

/**
 * @openapi
 * /api/v1/order-chats:
 *   get:
 *     tags: [Order Chat]
 *     summary: Get shared customer-provider conversation list for the authenticated user
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
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Conversation list returned
 */
router.get('/', validate(orderChatConversationListQuerySchema), OrderChatController.listConversations);

/**
 * @openapi
 * /api/v1/order-chats/conversations/{conversationId}/messages:
 *   get:
 *     tags: [Order Chat]
 *     summary: Get chat history for a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chat history returned
 *       403:
 *         description: User is not part of this conversation
 *       404:
 *         description: Conversation not found
 *   post:
 *     tags: [Order Chat]
 *     summary: Send a message for a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Can we confirm the setup timing?
 *               bookingId:
 *                 type: string
 *                 description: Optional booking context for the message when the conversation contains multiple bookings.
 *     responses:
 *       201:
 *         description: Message sent
 *       403:
 *         description: User is not part of this conversation
 *       404:
 *         description: Conversation not found
 */
router.get(
  '/conversations/:conversationId/messages',
  validate(orderChatMessagesQuerySchema),
  OrderChatController.getMessages
);
router.post(
  '/conversations/:conversationId/messages',
  validate(sendOrderChatMessageSchema),
  OrderChatController.sendMessage
);

export const orderChatRouter = router;
