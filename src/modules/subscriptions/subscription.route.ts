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
 *     SubscriptionStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *               example: 65f1a9d0f1b2c3d4e5f60001
 *             subscriptionStatus:
 *               type: string
 *               enum: [subscribed, not_subscribed]
 *               example: subscribed
 *             isSubscribed:
 *               type: boolean
 *               example: true
 *     SubscriptionPaymentIntentRequest:
 *       type: object
 *       properties:
 *         paymentMethodId:
 *           type: string
 *           description: Optional Stripe PaymentMethod id. In test mode you can use `pm_card_visa` to create and confirm the payment directly from Postman.
 *           example: pm_card_visa
 *         confirm:
 *           type: boolean
 *           description: When true, the backend creates and confirms the PaymentIntent immediately. Intended for testing flows such as Postman.
 *           example: true
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
 *             paymentStatus:
 *               type: string
 *               example: succeeded
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
 * /api/v1/subscriptions/status:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get current user's subscription status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionStatusResponse'
 *
 * @openapi
 * /api/v1/subscriptions/payment-intent:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Initiate subscription payment
 *     description: "For frontend Stripe Elements flows, call this endpoint with an empty body and use the returned clientSecret. For Postman-only test flows, send paymentMethodId = pm_card_visa and confirm = true, then call verify-payment with the returned paymentIntentId."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPaymentIntentRequest'
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
router.get('/status', SubscriptionController.getStatus);
router.post('/verify-payment', validate(verifySubscriptionPaymentSchema), SubscriptionController.verifyPayment);

export const subscriptionRouter = router;
