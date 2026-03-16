import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateCustomer } from '@/lib/stripe/subscription';

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export const POST = withAuth(async (request: NextRequest, { user }) => {
  // Validate origin to prevent CSRF
  const origin = request.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('host');
  if (origin && appUrl && !origin.includes(appUrl.replace(/^https?:\/\//, ''))) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = (body.plan === 'premium' ? 'premium' : 'pro') as string;
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
  }

  const customerId = await getOrCreateCustomer(user.id, user.email!);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?canceled=true`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
});
