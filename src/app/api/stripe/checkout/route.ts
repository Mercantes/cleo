import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateCustomer } from '@/lib/stripe/subscription';

export async function POST(request: NextRequest) {
  // Validate origin to prevent CSRF
  const origin = request.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('host');
  if (origin && appUrl && !origin.includes(appUrl.replace(/^https?:\/\//, ''))) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
  }

  const customerId = await getOrCreateCustomer(user.id, user.email!);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?canceled=true`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
