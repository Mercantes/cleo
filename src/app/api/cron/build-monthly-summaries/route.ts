import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildMonthlySummaries } from '@/lib/finance/prediction-engine';

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();

  // Get all active users
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 60);

  const { data: users } = await db
    .from('transactions')
    .select('user_id')
    .gte('date', sinceDate.toISOString().split('T')[0]);

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No active users', updated: 0 });
  }

  const uniqueUserIds = [...new Set(users.map((u: { user_id: string }) => u.user_id))];

  let totalSummaries = 0;
  let errors = 0;

  for (const userId of uniqueUserIds) {
    try {
      const count = await buildMonthlySummaries(userId);
      totalSummaries += count;
    } catch (err) {
      console.error(`[build-monthly-summaries] Error for user ${userId}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    message: 'Monthly summaries built',
    users: uniqueUserIds.length,
    summaries: totalSummaries,
    errors,
  });
}
