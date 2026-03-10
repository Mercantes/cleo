import { NextResponse } from 'next/server';
import { verifyPluggySignature } from '@/lib/pluggy/verify-signature';
import { handleWebhookEvent, type PluggyWebhookEvent } from '@/lib/pluggy/webhook-handler';

export async function POST(request: Request) {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('x-pluggy-signature') || '';

  if (!verifyPluggySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Return 200 immediately, process async
  const event = JSON.parse(body) as PluggyWebhookEvent;

  // Fire and forget — process in background
  handleWebhookEvent(event).catch(console.error);

  return NextResponse.json({ received: true });
}
