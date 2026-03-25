import Stripe from 'stripe';

function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) return key;
  if (process.env.NODE_ENV === 'test') return 'sk_test_placeholder';
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(getStripeKey(), {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});
