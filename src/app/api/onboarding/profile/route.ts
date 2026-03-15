import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/utils/with-auth';
import { isValidCPF, stripCPF } from '@/lib/utils/cpf';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const raw = await request.json();
  const cpf = typeof raw.cpf === 'string' ? stripCPF(raw.cpf) : '';

  if (!isValidCPF(cpf)) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
  }

  const serviceClient = getServiceClient();

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

  await serviceClient
    .from('profiles')
    .update({ cpf })
    .eq('id', user.id);

  return NextResponse.json({ success: true });
});
