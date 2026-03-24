import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/utils/with-auth';
import { stripe } from '@/lib/stripe/client';

export const GET = withAuth(async (_request, { user }) => {
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profile } = await serviceClient
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
