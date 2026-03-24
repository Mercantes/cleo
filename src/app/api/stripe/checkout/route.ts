import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateCustomer } from '@/lib/stripe/subscription';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID?.trim(),
  premium: process.env.STRIPE_PREMIUM_PRICE_ID?.trim(),
};

export const POST = withAuth(async (request: NextRequest, { user }) => {
  // Rate limit: 5 requests/min per user
  const rl = rateLimit(`stripe-checkout:${user.id}`, RATE_LIMITS['stripe-checkout']);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // Validate origin to prevent CSRF
  const origin = request.headers.get('origin');
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const host = request.headers.get('host') || '';
  if (origin && !origin.includes(host) && appUrl && !origin.includes(appUrl.replace(/^https?:\/\//, ''))) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = (body.plan === 'premium' ? 'premium' : 'pro') as string;
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
  }

  try {
    const customerId = await getOrCreateCustomer(user.id, user.email!);

    // Check if customer already has an active subscription (skip trial for upgrades)
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    const hasActiveSubscription = existingSubs.data.length > 0;

    const baseUrl = appUrl || `https://${host}`;
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/upgrade/success`,
      cancel_url: `${baseUrl}/upgrade?canceled=true`,
      metadata: { userId: user.id, plan },
    };

    // Only offer trial to new subscribers (no card required during trial)
    if (!hasActiveSubscription) {
      sessionParams.subscription_data = { trial_period_days: 7 };
      sessionParams.payment_method_collection = 'if_required';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe error' },
      { status: 500 },
    );
  }
});
