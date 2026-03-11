import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const CHALLENGE_TEMPLATES = [
  {
    title: 'Semana sem delivery',
    description: 'Não peça delivery por 7 dias e economize!',
    type: 'no_spend',
    durationDays: 7,
    xpReward: 50,
  },
  {
    title: 'Desafio da marmita',
    description: 'Leve marmita para o trabalho por 5 dias seguidos.',
    type: 'no_spend',
    durationDays: 5,
    xpReward: 40,
  },
  {
    title: 'Economia de R$100',
    description: 'Economize R$100 esta semana cortando gastos desnecessários.',
    type: 'savings',
    targetAmount: 100,
    durationDays: 7,
    xpReward: 60,
  },
  {
    title: 'Sem compras por impulso',
    description: 'Passe 3 dias sem comprar nada que não seja essencial.',
    type: 'no_spend',
    durationDays: 3,
    xpReward: 30,
  },
  {
    title: 'Caça ao desconto',
    description: 'Economize R$50 usando promoções e cupons esta semana.',
    type: 'savings',
    targetAmount: 50,
    durationDays: 7,
    xpReward: 45,
  },
  {
    title: 'Desafio do cofrinho',
    description: 'Reserve R$200 este mês para sua meta de economia.',
    type: 'savings',
    targetAmount: 200,
    durationDays: 30,
    xpReward: 100,
  },
];

export async function GET() {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();
  const { data: challenges } = await db
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(10);

  const active = (challenges || []).filter((c: { status: string }) => c.status === 'active');
  const completed = (challenges || []).filter((c: { status: string }) => c.status === 'completed');

  return NextResponse.json({
    active,
    completed,
    available: CHALLENGE_TEMPLATES,
  });
}

export async function POST(request: Request) {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { templateIndex, title, description, type, targetAmount, durationDays } = body;

  let challengeData;
  const db = getServiceClient();

  if (templateIndex !== undefined && templateIndex >= 0 && templateIndex < CHALLENGE_TEMPLATES.length) {
    const template = CHALLENGE_TEMPLATES[templateIndex];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + template.durationDays);
    challengeData = {
      user_id: user.id,
      title: template.title,
      description: template.description,
      type: template.type,
      target_amount: template.targetAmount || null,
      end_date: endDate.toISOString().split('T')[0],
    };
  } else if (title && type && durationDays) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    challengeData = {
      user_id: user.id,
      title: String(title).slice(0, 100),
      description: description ? String(description).slice(0, 500) : null,
      type: ['savings', 'spending_limit', 'no_spend', 'custom'].includes(type) ? type : 'custom',
      target_amount: targetAmount ? Number(targetAmount) : null,
      end_date: endDate.toISOString().split('T')[0],
    };
  } else {
    return NextResponse.json({ error: 'Invalid challenge data' }, { status: 400 });
  }

  const { data, error } = await db
    .from('challenges')
    .insert(challengeData)
    .select()
    .single();

  if (error) {
    console.error('[challenges] Create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ challenge: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { challengeId, status } = body;

  if (!challengeId || !['completed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  }

  const db = getServiceClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();

    // Increment XP and challenges completed
    const { data: goals } = await db
      .from('goals')
      .select('xp, total_challenges_completed, level')
      .eq('user_id', user.id)
      .single();

    if (goals) {
      const newXp = ((goals.xp as number) || 0) + 50;
      const newLevel = Math.floor(newXp / 100) + 1;
      await db
        .from('goals')
        .update({
          xp: newXp,
          level: newLevel,
          total_challenges_completed: ((goals.total_challenges_completed as number) || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }
  }

  const { error } = await db
    .from('challenges')
    .update(updates)
    .eq('id', challengeId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[challenges] Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
