import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/with-auth';
import { createSplitSchema, updateParticipantSchema, parseBody } from '@/lib/validations/api';
import { SupabaseClient } from '@supabase/supabase-js';

interface SplitParticipant {
  id?: string;
  name: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string | null;
}

function db(supabase: SupabaseClient) {
  return (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> });
}

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data, error } = await db(supabase)
    .from('expense_splits')
    .select('id, description, total_amount, transaction_id, created_at, split_participants(id, name, amount, is_paid, paid_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch splits' }, { status: 500 });

  return NextResponse.json({ splits: data || [] });
});

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const parsed = parseBody(createSplitSchema, body);
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error || 'Dados inválidos' }, { status: 400 });

  const { description, totalAmount, transactionId, participants } = parsed.data;

  const participantSum = participants.reduce((s, p) => s + p.amount, 0);
  if (Math.abs(participantSum - totalAmount) > 0.01) {
    return NextResponse.json({ error: 'Soma dos participantes deve igualar o total' }, { status: 400 });
  }

  const { data: split, error: splitError } = await db(supabase)
    .from('expense_splits')
    .insert({
      user_id: user.id,
      description,
      total_amount: totalAmount,
      transaction_id: transactionId || null,
    })
    .select()
    .single();

  if (splitError || !split) {
    return NextResponse.json({ error: 'Failed to create split' }, { status: 500 });
  }

  const splitId = (split as unknown as { id: string }).id;
  const participantRows = participants.map((p: SplitParticipant) => ({
    split_id: splitId,
    name: p.name,
    amount: p.amount,
    is_paid: p.is_paid || false,
  }));

  const { error: partError } = await db(supabase)
    .from('split_participants')
    .insert(participantRows);

  if (partError) {
    return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
  }

  const { data: full } = await db(supabase)
    .from('expense_splits')
    .select('id, description, total_amount, transaction_id, created_at, split_participants(id, name, amount, is_paid, paid_at)')
    .eq('id', splitId)
    .single();

  return NextResponse.json({ split: full }, { status: 201 });
});

export const PATCH = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  const parsed = parseBody(updateParticipantSchema, body);
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error || 'Dados inválidos' }, { status: 400 });

  const { participantId, isPaid } = parsed.data;

  const { data: participant } = await db(supabase)
    .from('split_participants')
    .select('id, split_id')
    .eq('id', participantId)
    .single();

  if (!participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  const pSplitId = (participant as unknown as { split_id: string }).split_id;
  const { data: split } = await db(supabase)
    .from('expense_splits')
    .select('user_id')
    .eq('id', pSplitId)
    .single();

  if (!split || (split as unknown as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await db(supabase)
    .from('split_participants')
    .update({
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq('id', participantId);

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

  return NextResponse.json({ success: true });
});

export const DELETE = withAuth(async (request: NextRequest, { supabase, user }) => {
  const { searchParams } = new URL(request.url);
  const splitId = searchParams.get('id');
  if (!splitId) return NextResponse.json({ error: 'Split ID required' }, { status: 400 });

  const { error } = await db(supabase)
    .from('expense_splits')
    .delete()
    .eq('id', splitId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to delete split' }, { status: 500 });

  return NextResponse.json({ success: true });
});
