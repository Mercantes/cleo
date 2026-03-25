import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectAnomalies } from '@/lib/finance/anomaly-detector';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = Number(request.nextUrl.searchParams.get('days') || '7');
  const daysBack = Math.min(Math.max(days, 1), 90);

  const anomalies = await detectAnomalies(user.id, daysBack);

  return NextResponse.json({ anomalies });
}
