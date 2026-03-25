import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification, isWebPushConfigured } from '@/lib/push/send';

export const maxDuration = 60;

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface Insight {
  title: string;
  body: string;
  tag: string;
  priority: number;
}

function generateInsights(
  currentTx: Array<{ amount: number; type: string; category_name?: string; category_id?: string }>,
  lastTx: Array<{ amount: number; type: string; category_name?: string }>,
  recurring: Array<{ amount: number }>,
  goals: { monthly_savings_target?: number; streak_months?: number } | null,
  budgets: Array<{ category_id: string; monthly_limit: number; category_name?: string }>,
  now: Date,
): Insight[] {
  const currentIncome = currentTx
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + Number(t.amount), 0);
  const currentExpenses = currentTx
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0);
  const lastExpenses = lastTx
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const insights: Insight[] = [];

  // Spending pace
  if (monthProgress > 0.3 && lastExpenses > 0) {
    const projectedExpenses = currentExpenses / monthProgress;
    const pacePercent = Math.round((projectedExpenses / lastExpenses - 1) * 100);
    if (pacePercent > 20) {
      insights.push({
        title: '📈 Gastos acelerando',
        body: `No ritmo atual, você vai gastar ${pacePercent}% a mais que o mês passado.`,
        tag: 'spending-pace',
        priority: 90,
      });
    } else if (pacePercent < -15) {
      insights.push({
        title: '🎉 Gastando menos!',
        body: `Você está no caminho para gastar ${Math.abs(pacePercent)}% menos que o mês passado.`,
        tag: 'spending-savings',
        priority: 70,
      });
    }
  }

  // Category spike
  const currentCats = new Map<string, number>();
  const lastCats = new Map<string, number>();
  for (const tx of currentTx.filter((t) => t.type === 'debit')) {
    const cat = tx.category_name || 'Outros';
    currentCats.set(cat, (currentCats.get(cat) || 0) + Number(tx.amount));
  }
  for (const tx of lastTx.filter((t) => t.type === 'debit')) {
    const cat = tx.category_name || 'Outros';
    lastCats.set(cat, (lastCats.get(cat) || 0) + Number(tx.amount));
  }
  for (const [cat, amount] of currentCats) {
    const lastAmount = lastCats.get(cat) || 0;
    if (lastAmount > 0 && monthProgress > 0.3) {
      const projected = amount / monthProgress;
      const spike = ((projected - lastAmount) / lastAmount) * 100;
      if (spike > 50 && projected > 100) {
        insights.push({
          title: `⚠️ ${cat} subindo`,
          body: `Gastos com ${cat} estão ${Math.round(spike)}% acima do mês passado. Já gastou ${formatBRL(amount)}.`,
          tag: `spike-${cat}`,
          priority: 80,
        });
        break;
      }
    }
  }

  // Goal progress
  if (goals?.monthly_savings_target) {
    const target = Number(goals.monthly_savings_target);
    const savings = Math.max(0, currentIncome - currentExpenses);
    const progress = target > 0 ? (savings / target) * 100 : 0;

    if (progress >= 100) {
      insights.push({
        title: '🏆 Meta atingida!',
        body: `Você economizou ${formatBRL(savings)} este mês, superando a meta de ${formatBRL(target)}!`,
        tag: 'goal-met',
        priority: 95,
      });
    } else if (monthProgress > 0.5 && progress < 30) {
      insights.push({
        title: '🎯 Meta precisa de atenção',
        body: `Você está em ${Math.round(progress)}% da meta com ${Math.round((1 - monthProgress) * 100)}% do mês restante.`,
        tag: 'goal-behind',
        priority: 75,
      });
    }
  }

  // Budget overspend
  if (budgets.length > 0) {
    const spendingByCat = new Map<string, number>();
    for (const tx of currentTx.filter((t) => t.type === 'debit')) {
      if (tx.category_id) {
        spendingByCat.set(
          tx.category_id,
          (spendingByCat.get(tx.category_id) || 0) + Number(tx.amount),
        );
      }
    }
    for (const budget of budgets) {
      const spent = spendingByCat.get(budget.category_id) || 0;
      const pct = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
      if (pct >= 100) {
        insights.push({
          title: `🚨 ${budget.category_name || 'Categoria'}: orçamento estourado`,
          body: `Já gastou ${formatBRL(spent)} de ${formatBRL(budget.monthly_limit)} (${Math.round(pct)}%).`,
          tag: `budget-over-${budget.category_id}`,
          priority: 92,
        });
        break;
      } else if (pct >= 80) {
        insights.push({
          title: `⚠️ ${budget.category_name || 'Categoria'}: quase no limite`,
          body: `Já usou ${Math.round(pct)}% do orçamento. Restam ${formatBRL(budget.monthly_limit - spent)}.`,
          tag: `budget-warn-${budget.category_id}`,
          priority: 82,
        });
        break;
      }
    }
  }

  // Subscriptions weight
  if (recurring.length > 0 && currentIncome > 0) {
    const totalRecurring = recurring.reduce((s, r) => s + Number(r.amount), 0);
    const recurringPercent = Math.round((totalRecurring / currentIncome) * 100);
    if (recurringPercent > 30) {
      insights.push({
        title: '💡 Assinaturas pesando',
        body: `Recorrências somam ${formatBRL(totalRecurring)}/mês (${recurringPercent}% da renda).`,
        tag: 'subscriptions-high',
        priority: 60,
      });
    }
  }

  insights.sort((a, b) => b.priority - a.priority);
  return insights;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({ message: 'Push not configured', sent: 0 });
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

  // Group by user
  const userSubs = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
  for (const sub of subscriptions) {
    const existing = userSubs.get(sub.user_id) || [];
    existing.push({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth });
    userSubs.set(sub.user_id, existing);
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  let sentCount = 0;

  for (const [userId, subs] of userSubs) {
    try {
      const [currentTxRes, lastTxRes, recurringRes, goalsRes, budgetsRes] = await Promise.all([
        db
          .from('transactions')
          .select('amount, type, category_id, categories(name)')
          .eq('user_id', userId)
          .gte('date', currentMonth)
          .lte('date', currentMonthEnd),
        db
          .from('transactions')
          .select('amount, type, categories(name)')
          .eq('user_id', userId)
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd),
        db
          .from('recurring_transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('status', 'active'),
        db
          .from('goals')
          .select('monthly_savings_target, streak_months')
          .eq('user_id', userId)
          .single(),
        db
          .from('category_budgets')
          .select('category_id, monthly_limit, categories(name)')
          .eq('user_id', userId),
      ]);

      const currentTx = (currentTxRes.data || []).map((t: Record<string, unknown>) => ({
        amount: t.amount as number,
        type: t.type as string,
        category_id: t.category_id as string | undefined,
        category_name: (t.categories as { name: string } | null)?.name,
      }));
      const lastTx = (lastTxRes.data || []).map((t: Record<string, unknown>) => ({
        amount: t.amount as number,
        type: t.type as string,
        category_name: (t.categories as { name: string } | null)?.name,
      }));
      const recurring = (recurringRes.data || []).map((r: Record<string, unknown>) => ({
        amount: r.amount as number,
      }));
      const budgets = (budgetsRes.data || []).map((b: Record<string, unknown>) => ({
        category_id: b.category_id as string,
        monthly_limit: Number(b.monthly_limit),
        category_name: (b.categories as { name: string } | null)?.name,
      }));

      const insights = generateInsights(currentTx, lastTx, recurring, goalsRes.data, budgets, now);

      // Send only the top insight per user (avoid notification spam)
      const topInsight = insights[0];
      if (!topInsight) continue;

      for (const sub of subs) {
        try {
          await sendPushNotification(sub, {
            title: topInsight.title,
            body: topInsight.body,
            tag: topInsight.tag,
            url: '/dashboard',
          });
          sentCount++;
        } catch (err) {
          console.error(`[daily-insights] Push failed for ${sub.endpoint}:`, err);
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
      console.error(`[daily-insights] Error for user ${userId}:`, err);
    }
  }

  return NextResponse.json({ message: 'Daily insights sent', sent: sentCount });
}
