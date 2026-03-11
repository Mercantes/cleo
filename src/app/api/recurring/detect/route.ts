import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectAndSaveRecurring } from '@/lib/finance/recurring-detector';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await detectAndSaveRecurring(user.id);

    return NextResponse.json({
      detected: results.length,
      subscriptions: results.filter((r) => r.type === 'subscription').length,
      installments: results.filter((r) => r.type === 'installment').length,
    });
  } catch (error) {
    console.error('[recurring/detect] detection failed:', error);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}
