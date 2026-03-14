import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { detectAndSaveRecurring } from '@/lib/finance/recurring-detector';

export const POST = withAuth(async (_request, { user }) => {
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
});
