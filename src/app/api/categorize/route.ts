import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeTransactions } from '@/lib/ai/categorize';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      transactions?: { id: string; description: string; amount: number; type: string }[];
      transactionIds?: string[];
      all?: boolean;
    };

    // Mode 1: Direct transactions array
    if (body.transactions?.length) {
      const categorized = await categorizeTransactions(body.transactions);
      return NextResponse.json({ categorized });
    }

    // Mode 2: Re-categorize by IDs or all uncategorized
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = serviceClient
      .from('transactions')
      .select('id, description, amount, type')
      .eq('user_id', user.id);

    if (body.transactionIds?.length) {
      query = query.in('id', body.transactionIds);
    } else if (body.all) {
      query = query.or('category_id.is.null,category_confidence.lt.0.70');
    } else {
      return NextResponse.json({ error: 'Provide transactions, transactionIds, or all flag' }, { status: 400 });
    }

    const { data: txs, error } = await query.limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!txs?.length) {
      return NextResponse.json({ categorized: 0, message: 'No transactions to categorize' });
    }

    const categorized = await categorizeTransactions(txs);
    return NextResponse.json({ categorized, total: txs.length });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
