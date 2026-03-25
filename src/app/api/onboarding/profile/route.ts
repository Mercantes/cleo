import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/utils/with-auth';
import { isValidCPF, stripCPF } from '@/lib/utils/cpf';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const raw = await request.json();
  const cpf = typeof raw.cpf === 'string' ? stripCPF(raw.cpf) : '';

  if (!isValidCPF(cpf)) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
  }

  const serviceClient = createAdminClient();

  // Check if CPF already exists on another account
  const { data: existing } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('cpf', cpf)
    .neq('id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'CPF_ALREADY_EXISTS' }, { status: 409 });
  }

  await serviceClient.from('profiles').update({ cpf }).eq('id', user.id);

  return NextResponse.json({ success: true });
});
