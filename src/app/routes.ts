import { Router } from 'express';
import { adminManagementRouter } from '../modules/admin-management/admin-management.route';
import { authRouter } from '../modules/auth/auth.route';
import { bookingRouter } from '../modules/bookings/booking.route';
import { eventPlannerRouter } from '../modules/event-planner/event-planner.route';
import { orderChatRouter } from '../modules/order-chat/order-chat.route';
import { publicRouter } from '../modules/public/public.route';
import { serviceProviderRouter } from '../modules/service-provider/service-provider.route';
import { subscriptionRouter } from '../modules/subscriptions/subscription.route';
import { uploadRouter } from '../modules/uploads/upload.route';
import { venueProviderRouter } from '../modules/venue-provider/venue-provider.route';

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags: [System]
 *     summary: Root status
 *     responses:
 *       200:
 *         description: API root
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'EvenIt backend is running 🚀✨🔥'
  });
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Healthy
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'OK'
  });
});

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/bookings', bookingRouter);
router.use('/api/v1/event-planners', eventPlannerRouter);
router.use('/api/v1/order-chats', orderChatRouter);
router.use('/api/v1/public', publicRouter);
router.use('/api/v1/service-provider', serviceProviderRouter);
router.use('/api/v1/subscriptions', subscriptionRouter);
router.use('/api/v1/uploads', uploadRouter);
router.use('/api/v1/venue-provider', venueProviderRouter);
router.use('/api/v1/admin', adminManagementRouter);

export { router };
