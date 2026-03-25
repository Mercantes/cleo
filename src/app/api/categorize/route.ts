import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 20 requests/min per user (AI-powered route)
  const rl = rateLimit(`categorize:${user.id}`, RATE_LIMITS.chat);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  try {
    const body = (await request.json()) as {
      transactions?: { id: string; description: string; amount: number; type: string }[];
      transactionIds?: string[];
      all?: boolean;
    };

    // Mode 1: Direct transactions array
    if (body.transactions?.length) {
      const categorized = await categorizeTransactions(body.transactions, user.id);
      return NextResponse.json({ categorized });
    }

    // Mode 2: Re-categorize by IDs or all uncategorized
    const serviceClient = createAdminClient();

    let query = serviceClient
      .from('transactions')
      .select('id, description, amount, type')
      .eq('user_id', user.id);

    if (body.transactionIds?.length) {
      if (body.transactionIds.length > 500) {
        return NextResponse.json({ error: 'Máximo 500 transações por vez' }, { status: 400 });
      }
      query = query.in('id', body.transactionIds);
    } else if (body.all) {
      query = query.or('category_id.is.null,category_confidence.lt.0.70');
    } else {
      return NextResponse.json(
        { error: 'Provide transactions, transactionIds, or all flag' },
        { status: 400 },
      );
    }

    const { data: txs, error } = await query.limit(500);

    if (error) {
      console.error('[categorize] query failed:', error.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!txs?.length) {
      return NextResponse.json({ categorized: 0, message: 'No transactions to categorize' });
    }

    const categorized = await categorizeTransactions(txs, user.id);
    return NextResponse.json({ categorized, total: txs.length });
  } catch (error) {
    console.error('[categorize] categorization failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
