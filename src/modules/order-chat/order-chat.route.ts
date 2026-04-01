import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { OrderChatController } from './order-chat.controller';
import { orderChatMessagesQuerySchema, sendOrderChatMessageSchema } from './order-chat.schema';

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
 * /api/v1/order-chats/{bookingId}/messages:
 *   get:
 *     tags: [Order Chat]
 *     summary: Get chat history for a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *         description: User is not part of this booking
 *       404:
 *         description: Booking not found
 *   post:
 *     tags: [Order Chat]
 *     summary: Send a message for a booking
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Can we confirm the setup timing?
 *     responses:
 *       201:
 *         description: Message sent
 *       403:
 *         description: User is not part of this booking
 *       404:
 *         description: Booking not found
 */
router.get('/:bookingId/messages', validate(orderChatMessagesQuerySchema), OrderChatController.getMessages);
router.post('/:bookingId/messages', validate(sendOrderChatMessageSchema), OrderChatController.sendMessage);

export const orderChatRouter = router;

