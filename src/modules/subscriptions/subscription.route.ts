import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { SubscriptionController } from './subscription.controller';
import {
  createSubscriptionPaymentIntentSchema,
  verifySubscriptionPaymentSchema
} from './subscription.schema';

const router = Router();

router.use(protect);

/**
 * @openapi
 * tags:
 *   - name: Subscriptions
 *     description: Subscription payment initiation and verification
 * components:
 *   schemas:
 *     SubscriptionPaymentIntentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Subscription payment initiated successfully
 *         data:
 *           type: object
 *           properties:
 *             clientSecret:
 *               type: string
 *             paymentIntentId:
 *               type: string
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *             plan:
 *               type: string
 *             billingCycle:
 *               type: string
 *     SubscriptionVerifyRequest:
 *       type: object
 *       required: [paymentIntentId]
 *       properties:
 *         paymentIntentId:
 *           type: string
 *           example: pi_3Qexample123
 *     SubscriptionVerifyResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Subscription payment verified successfully
 *         data:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *             status:
 *               type: string
 *             activatedAt:
 *               type: string
 *               format: date-time
 *             payment:
 *               type: object
 *               properties:
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 billingCycle:
 *                   type: string
 *                 status:
 *                   type: string
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *
 * @openapi
 * /api/v1/subscriptions/payment-intent:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Initiate subscription payment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPaymentIntentResponse'
 *
 * @openapi
 * /api/v1/subscriptions/verify-payment:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Verify subscription payment and activate subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionVerifyRequest'
 *     responses:
 *       200:
 *         description: Subscription payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionVerifyResponse'
 */
router.post(
  '/payment-intent',
  validate(createSubscriptionPaymentIntentSchema),
  SubscriptionController.createPaymentIntent
);
router.post('/verify-payment', validate(verifySubscriptionPaymentSchema), SubscriptionController.verifyPayment);

export const subscriptionRouter = router;
