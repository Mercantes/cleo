import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateSpendingStats } from '@/lib/finance/anomaly-detector';

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();

  // Get all active users (those with transactions in last 60 days)
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 60);

  const { data: users } = await db
    .from('transactions')
    .select('user_id')
    .gte('date', sinceDate.toISOString().split('T')[0]);

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No active users', updated: 0 });
  }

  // Deduplicate user IDs
  const uniqueUserIds = [...new Set(users.map((u: { user_id: string }) => u.user_id))];

  let totalStats = 0;
  let errors = 0;

  for (const userId of uniqueUserIds) {
    try {
      const count = await updateSpendingStats(userId);
      totalStats += count;
    } catch (err) {
      console.error(`[update-spending-stats] Error for user ${userId}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    message: 'Spending stats updated',
    users: uniqueUserIds.length,
    stats: totalStats,
    errors,
  });
}
