import { NextResponse } from 'next/server';
import { handleWebhookEvent, type PluggyWebhookEvent } from '@/lib/pluggy/webhook-handler';

export async function POST(request: Request) {
  const body = await request.text();

  let event: PluggyWebhookEvent;
  try {
    event = JSON.parse(body) as PluggyWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!event.event) {
    return NextResponse.json({ error: 'Missing event field' }, { status: 400 });
  }

  // Fire and forget — process in background
  handleWebhookEvent(event).catch((error) => {
    console.error('[pluggy-webhook] async processing error:', error);
  });

  return NextResponse.json({ received: true });
}
