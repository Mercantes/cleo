import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { updateUserTier, setGracePeriod } from '@/lib/stripe/subscription';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && session.subscription) {
        await updateUserTier(
          session.customer as string,
          'pro',
          session.subscription as string,
          'active',
        );
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status;
      if (status === 'active' || status === 'trialing') {
        await updateUserTier(subscription.customer as string, 'pro', subscription.id, status);
      } else if (status === 'past_due') {
        await setGracePeriod(subscription.customer as string, 7);
      } else if (status === 'canceled' || status === 'unpaid') {
        await updateUserTier(subscription.customer as string, 'free', null as unknown as string, status);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserTier(
        subscription.customer as string,
        'free',
        undefined,
        'canceled',
      );
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
        await setGracePeriod(invoice.customer as string, 7);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
