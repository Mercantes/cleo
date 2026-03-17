import { NextResponse } from 'next/server';
import { handleWebhookEvent, type PluggyWebhookEvent } from '@/lib/pluggy/webhook-handler';

export async function POST(request: Request) {
  const body = await request.text();

  console.log('[pluggy-webhook] received:', body.substring(0, 500));

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

  console.log('[pluggy-webhook] processing event:', event.event, 'itemId:', event.data?.itemId);

  // Fire and forget — process in background
  handleWebhookEvent(event).catch((error) => {
    console.error('[pluggy-webhook] async processing error:', error);
  });

  return NextResponse.json({ received: true });
}
