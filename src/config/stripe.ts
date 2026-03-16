import Stripe from 'stripe';
import { env } from './env';

let stripeClient: Stripe | null = null;

export const hasStripeConfig = (): boolean => Boolean(env.STRIPE_SECRET_KEY);

export const getStripe = (): Stripe => {
  if (!hasStripeConfig()) {
    throw new Error('Stripe secret key is not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};
