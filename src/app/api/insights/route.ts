import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'celebration' | 'suggestion';
  icon: string;
  title: string;
  message: string;
  priority: number;
}

export async function GET() {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const [currentTxRes, lastTxRes, recurringRes, goalsRes] = await Promise.all([
    db.from('transactions').select('amount, type, categories(name)').eq('user_id', user.id)
      .gte('date', currentMonth).lte('date', currentMonthEnd),
    db.from('transactions').select('amount, type, categories(name)').eq('user_id', user.id)
      .gte('date', lastMonthStart).lte('date', lastMonthEnd),
    db.from('recurring_transactions').select('merchant, amount, type').eq('user_id', user.id).eq('status', 'active'),
    db.from('goals').select('monthly_savings_target, streak_months, level').eq('user_id', user.id).single(),
  ]);

  const currentTx = currentTxRes.data || [];
  const lastTx = lastTxRes.data || [];
  const recurring = recurringRes.data || [];
  const goals = goalsRes.data;

  const currentIncome = currentTx.filter((t: { type: string }) => t.type === 'credit').reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
  const currentExpenses = currentTx.filter((t: { type: string }) => t.type === 'debit').reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
  const lastExpenses = lastTx.filter((t: { type: string }) => t.type === 'debit').reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const insights: Insight[] = [];

  // 1. Spending pace warning
  if (monthProgress > 0.3 && lastExpenses > 0) {
    const projectedExpenses = currentExpenses / monthProgress;
    const pacePercent = Math.round((projectedExpenses / lastExpenses - 1) * 100);
    if (pacePercent > 20) {
      insights.push({
        id: 'spending-pace',
        type: 'warning',
        icon: '📈',
        title: 'Gastos acelerando',
        message: `No ritmo atual, você vai gastar ${pacePercent}% a mais que o mês passado. Considere revisar seus gastos nos próximos dias.`,
        priority: 90,
      });
    } else if (pacePercent < -15) {
      insights.push({
        id: 'spending-savings',
        type: 'celebration',
        icon: '🎉',
        title: 'Gastando menos!',
        message: `Ótimo! Você está no caminho para gastar ${Math.abs(pacePercent)}% menos que o mês passado.`,
        priority: 70,
      });
    }
  }

  // 2. Category spike detection
  const currentCats = new Map<string, number>();
  const lastCats = new Map<string, number>();

  for (const tx of currentTx.filter((t: { type: string }) => t.type === 'debit')) {
    const cat = (tx.categories as unknown as { name: string } | null)?.name || 'Outros';
    currentCats.set(cat, (currentCats.get(cat) || 0) + Number(tx.amount));
  }
  for (const tx of lastTx.filter((t: { type: string }) => t.type === 'debit')) {
    const cat = (tx.categories as unknown as { name: string } | null)?.name || 'Outros';
    lastCats.set(cat, (lastCats.get(cat) || 0) + Number(tx.amount));
  }

  for (const [cat, amount] of currentCats) {
    const lastAmount = lastCats.get(cat) || 0;
    if (lastAmount > 0 && monthProgress > 0.3) {
      const projected = amount / monthProgress;
      const spike = ((projected - lastAmount) / lastAmount) * 100;
      if (spike > 50 && projected > 100) {
        insights.push({
          id: `spike-${cat}`,
          type: 'warning',
          icon: '⚠️',
          title: `${cat} subindo`,
          message: `Seus gastos com ${cat} estão ${Math.round(spike)}% acima do mês passado. Já gastou R$ ${amount.toFixed(0)} até agora.`,
          priority: 80,
        });
        break; // Only show top spike
      }
    }
  }

  // 3. Subscription cost awareness
  if (recurring.length > 0) {
    const totalRecurring = recurring.reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);
    if (totalRecurring > 0 && currentIncome > 0) {
      const recurringPercent = Math.round((totalRecurring / currentIncome) * 100);
      if (recurringPercent > 30) {
        insights.push({
          id: 'subscriptions-high',
          type: 'tip',
          icon: '💡',
          title: 'Assinaturas pesando',
          message: `Suas assinaturas e recorrências somam R$ ${totalRecurring.toFixed(0)}/mês (${recurringPercent}% da renda). Revise se todas são necessárias.`,
          priority: 60,
        });
      }
    }
  }

  // 4. Goal progress motivation
  if (goals?.monthly_savings_target) {
    const target = Number(goals.monthly_savings_target);
    const savings = Math.max(0, currentIncome - currentExpenses);
    const progress = target > 0 ? (savings / target) * 100 : 0;

    if (progress >= 100) {
      insights.push({
        id: 'goal-met',
        type: 'celebration',
        icon: '🏆',
        title: 'Meta atingida!',
        message: `Parabéns! Você já economizou R$ ${savings.toFixed(0)} este mês, superando sua meta de R$ ${target.toFixed(0)}!`,
        priority: 95,
      });
    } else if (progress >= 75) {
      insights.push({
        id: 'goal-almost',
        type: 'celebration',
        icon: '🔥',
        title: 'Quase lá!',
        message: `Você já atingiu ${Math.round(progress)}% da sua meta mensal. Faltam R$ ${(target - savings).toFixed(0)}!`,
        priority: 85,
      });
    } else if (monthProgress > 0.5 && progress < 30) {
      insights.push({
        id: 'goal-behind',
        type: 'suggestion',
        icon: '🎯',
        title: 'Meta precisa de atenção',
        message: `Você está em ${Math.round(progress)}% da meta com ${Math.round((1 - monthProgress) * 100)}% do mês restante. Tente reduzir gastos nos próximos dias.`,
        priority: 75,
      });
    }
  }

  // 5. Savings streak celebration
  if (goals?.streak_months && goals.streak_months >= 2) {
    insights.push({
      id: 'streak',
      type: 'celebration',
      icon: '🔥',
      title: `Sequência de ${goals.streak_months} meses!`,
      message: `Você está atingindo sua meta há ${goals.streak_months} meses seguidos. Continue assim!`,
      priority: 50,
    });
  }

  // Sort by priority and limit
  insights.sort((a, b) => b.priority - a.priority);

  return NextResponse.json({
    insights: insights.slice(0, 4),
  });
}
