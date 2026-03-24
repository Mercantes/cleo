import { NextResponse } from 'next/server';
import { handleWebhookEvent, type PluggyWebhookEvent } from '@/lib/pluggy/webhook-handler';
import { verifyPluggySignature } from '@/lib/pluggy/verify-signature';

export async function POST(request: Request) {
  const body = await request.text();

  console.warn('[pluggy-webhook] received:', body.substring(0, 500));

  // Verify webhook signature when secret is configured
  const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = request.headers.get('x-pluggy-signature') || '';
    if (!verifyPluggySignature(body, signature, webhookSecret)) {
      console.warn('[pluggy-webhook] invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: PluggyWebhookEvent;
  try {
    event = JSON.parse(body) as PluggyWebhookEvent;
  } catch {
    console.error('[pluggy-webhook] invalid JSON:', body.substring(0, 200));
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!event.event) {
    console.warn('[pluggy-webhook] missing event field, keys:', Object.keys(event).join(','));
    return NextResponse.json({ error: 'Missing event field' }, { status: 400 });
  }

  console.warn('[pluggy-webhook] processing event:', event.event, 'itemId:', event.data?.itemId);

  // Fire and forget — process in background
  handleWebhookEvent(event).catch((error) => {
    console.error('[pluggy-webhook] async processing error:', error);
  });

  return NextResponse.json({ received: true });
}
