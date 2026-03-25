import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadPreferences, savePreferences } from '@/lib/ai/preference-engine';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const preferences = await loadPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
  }

  const count = await savePreferences(user.id, [{ key, value }], 'explicit');

  if (count > 0) {
    return NextResponse.json({ success: true, key, value });
  }

  return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
}
