import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { SubscriptionController } from './subscription.controller';

const router = Router();

router.use(protect);

/**
 * @openapi
 * tags:
 *   - name: Subscriptions
 *     description: Subscription payment initiation and verification
 * components:
 *   schemas:
 *     SubscriptionPaymentLinkResponse:
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
 *             role:
 *               type: string
 *               enum: [customer, service_provider, event_planner, venue_provider]
 *             subscriptionStatus:
 *               type: string
 *               enum: [subscribed, not_subscribed]
 *             isSubscribed:
 *               type: boolean
 *             paymentLink:
 *               type: string
 *               format: uri
 *               description: Stripe Checkout URL with locked email and client_reference_id attached for webhook reconciliation
 *     StripeWebhookResponse:
 *       type: object
 *       properties:
 *         received:
 *           type: boolean
 *           example: true
 *     SubscriptionWebhookErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Stripe webhook signature header is missing
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
 * @openapi
 * /api/v1/subscriptions/webhook:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Stripe webhook endpoint for automated subscription updates
 *     description: Stripe calls this endpoint directly. It must receive the raw request body. Successful payments and subscription status changes are synced automatically from webhook events.
 *     responses:
 *       200:
 *         description: Webhook event received successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeWebhookResponse'
 *       400:
 *         description: Invalid webhook signature or malformed webhook request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionWebhookErrorResponse'
 *       500:
 *         description: Internal webhook processing failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionWebhookErrorResponse'
 *
 * @openapi
 * /api/v1/subscriptions/payment-link:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get the Stripe payment link for the current user's role
 *     description: Returns a Stripe-hosted subscription checkout URL in test mode. After a successful checkout, Stripe webhooks update the user's subscription automatically.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription payment link fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPaymentLinkResponse'
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
 */
router.get('/payment-link', SubscriptionController.getPaymentLink);
router.get('/status', SubscriptionController.getStatus);

export const subscriptionRouter = router;
