import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { parseBody } from '@/lib/validations/api';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
});

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ profile: profile || { full_name: '', email: user.email } });
});

export const PATCH = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const parsed = parseBody(profileSchema, body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || 'Dados inválidos' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
