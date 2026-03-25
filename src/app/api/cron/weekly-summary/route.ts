import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification, isWebPushConfigured } from '@/lib/push/send';

export const maxDuration = 60;

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();

  // Get all users with push subscriptions
  const { data: subscriptions } = await (
    db as unknown as { from: (t: string) => ReturnType<typeof db.from> }
  )
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: 'No subscriptions', sent: 0 });
  }

  if (!isWebPushConfigured()) {
    console.warn('[weekly-summary] VAPID keys not configured, skipping push delivery');
    return NextResponse.json({ message: 'Push not configured', sent: 0 });
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

  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const prevWeekStart = twoWeeksAgo.toISOString().split('T')[0];

  for (const [userId, subs] of userSubs) {
    try {
      // Get this week + previous week transactions for comparison
      const { data: transactions } = await db
        .from('transactions')
        .select('amount, type, category_name, date')
        .eq('user_id', userId)
        .gte('date', prevWeekStart)
        .lte('date', weekEnd);

      if (!transactions || transactions.length === 0) continue;

      const thisWeek = transactions.filter((t: { date: string }) => t.date >= weekStart);
      const prevWeek = transactions.filter(
        (t: { date: string }) => t.date >= prevWeekStart && t.date < weekStart,
      );

      const income = thisWeek
        .filter((t: { type: string }) => t.type === 'credit')
        .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
      const expenses = thisWeek
        .filter((t: { type: string }) => t.type === 'debit')
        .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
      const prevExpenses = prevWeek
        .filter((t: { type: string }) => t.type === 'debit')
        .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
      const txCount = thisWeek.length;

      // Top 3 spending categories
      const catTotals = new Map<string, number>();
      for (const t of thisWeek.filter((t: { type: string }) => t.type === 'debit')) {
        const cat = (t as { category_name?: string }).category_name || 'Outros';
        catTotals.set(cat, (catTotals.get(cat) || 0) + Math.abs(Number(t.amount)));
      }
      const topCats = [...catTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, val]) => `${name}: ${formatBRL(val)}`)
        .join(', ');

      // Week-over-week comparison
      let comparison = '';
      if (prevExpenses > 0) {
        const pctChange = ((expenses - prevExpenses) / prevExpenses) * 100;
        comparison =
          pctChange > 0
            ? ` (+${Math.round(pctChange)}% vs semana anterior)`
            : ` (${Math.round(pctChange)}% vs semana anterior)`;
      }

      const body = `${txCount} transações. Gastos: ${formatBRL(expenses)}${comparison}${income > 0 ? ` | Receitas: ${formatBRL(income)}` : ''}. Top: ${topCats || 'N/A'}.`;

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
          // Remove expired/invalid subscriptions (410 Gone, 404 Not Found)
          if (
            err instanceof Error &&
            (err.message.includes('410') || err.message.includes('404'))
          ) {
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
