import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { updateUserTier, setGracePeriod } from '@/lib/stripe/subscription';
import { createAdminClient } from '@/lib/supabase/admin';

// In-memory set for idempotency (short-lived — serverless functions restart often)
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 500;

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('[stripe/webhook] invalid signature:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check — skip already-processed events
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
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
          await updateUserTier(
            subscription.customer as string,
            'free',
            null as unknown as string,
            status,
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserTier(subscription.customer as string, 'free', undefined, 'canceled');
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
  } catch (error) {
    console.error(`[stripe/webhook] error processing ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  // Mark event as processed
  processedEvents.add(event.id);
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const first = processedEvents.values().next().value;
    if (first) processedEvents.delete(first);
  }

  console.warn(`[stripe/webhook] processed ${event.type} (${event.id}) successfully`);
  return NextResponse.json({ received: true });
}
