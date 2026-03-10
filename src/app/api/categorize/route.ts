import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeTransactions } from '@/lib/ai/categorize';

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
      transactions: { id: string; description: string; amount: number; type: string }[];
    };

    if (!body.transactions?.length) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    const categorized = await categorizeTransactions(body.transactions);

    return NextResponse.json({ categorized });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
