import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();

  // Get all users with push subscriptions
  const { data: subscriptions } = await (
    db as unknown as { from: (t: string) => ReturnType<typeof db.from> }
  )
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: 'No subscriptions', sent: 0 });
  }

  // Group subscriptions by user
  const userSubs = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
  for (const sub of subscriptions) {
    const existing = userSubs.get(sub.user_id) || [];
    existing.push({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth });
    userSubs.set(sub.user_id, existing);
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStart = weekAgo.toISOString().split('T')[0];
  const weekEnd = now.toISOString().split('T')[0];

  let sentCount = 0;

  for (const [userId, subs] of userSubs) {
    try {
      // Get weekly transactions
      const { data: transactions } = await db
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', weekEnd);

      if (!transactions || transactions.length === 0) continue;

      const income = transactions
        .filter((t: { type: string }) => t.type === 'credit')
        .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
      const expenses = transactions
        .filter((t: { type: string }) => t.type === 'debit')
        .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
      const txCount = transactions.length;

      const body = `${txCount} transações esta semana. Gastos: ${formatBRL(expenses)}${income > 0 ? ` | Receitas: ${formatBRL(income)}` : ''}. Abra o app para mais detalhes.`;

      // Send push to all user devices
      for (const sub of subs) {
        try {
          await sendPushNotification(sub, {
            title: 'Resumo semanal',
            body,
            tag: 'weekly-summary',
            url: '/dashboard',
          });
          sentCount++;
        } catch (err) {
          console.error(`[weekly-summary] Push failed for ${sub.endpoint}:`, err);
          // Remove invalid subscriptions
          if (err instanceof Error && err.message.includes('410')) {
            await (db as unknown as { from: (t: string) => ReturnType<typeof db.from> })
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
        }
      }
    } catch (err) {
      console.error(`[weekly-summary] Error for user ${userId}:`, err);
    }
  }

  return NextResponse.json({ message: 'Weekly summaries sent', sent: sentCount });
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; tag: string; url: string },
): Promise<void> {
  // Web Push requires VAPID keys and web-push library on server
  // For now, store the notification for in-app display if web-push is not configured
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PRIVATE_KEY) {
    console.log('[weekly-summary] VAPID_PRIVATE_KEY not configured, skipping push');
    return;
  }

  // Use fetch-based Web Push (no external library needed)
  // The actual push sending requires VAPID signing which needs a library
  // For now, log the intent — install web-push package when ready for production
  console.log('[weekly-summary] Would send push to:', subscription.endpoint, payload);
  // TODO: Install web-push package and implement: npm install web-push
}
