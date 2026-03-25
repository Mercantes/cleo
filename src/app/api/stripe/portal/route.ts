import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';

export const GET = withAuth(async (_request, { user }) => {
  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${(process.env.NEXT_PUBLIC_APP_URL || '').trim()}/upgrade`,
  });

  return NextResponse.json({ url: session.url });
});
