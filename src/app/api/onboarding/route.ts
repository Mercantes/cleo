import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/utils/with-auth';

const onboardingPatchSchema = z.object({
  step: z.number().int().min(0).max(10).optional(),
  completed: z.boolean().optional(),
  skippedSteps: z.array(z.string()).optional(),
});

const onboardingPostSchema = z.object({
  monthlySavingsTarget: z.number().min(0).max(10_000_000).optional(),
  retirementAgeTarget: z.number().int().min(18).max(120).optional(),
});

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const GET = withAuth(async (_request, { user }) => {
  const serviceClient = getServiceClient();
  const { data } = await serviceClient
    .from('profiles')
    .select('onboarding_step, onboarding_completed, onboarding_skipped_steps, full_name')
    .eq('id', user.id)
    .single();

  const firstName = data?.full_name?.split(' ')[0] || undefined;

  return NextResponse.json({
    step: data?.onboarding_step || 0,
    completed: data?.onboarding_completed || false,
    skippedSteps: data?.onboarding_skipped_steps || [],
    userName: firstName,
  });
});

export const PATCH = withAuth(async (request: NextRequest, { user }) => {
  const raw = await request.json();
  const parsed = onboardingPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const serviceClient = getServiceClient();
  const update: Record<string, unknown> = {};

  if (parsed.data.step !== undefined) {
    update.onboarding_step = parsed.data.step;
  }
  if (parsed.data.completed !== undefined) {
    update.onboarding_completed = parsed.data.completed;
  }
  if (parsed.data.skippedSteps !== undefined) {
    update.onboarding_skipped_steps = parsed.data.skippedSteps;
  }

  await serviceClient
    .from('profiles')
    .update(update)
    .eq('id', user.id);

  return NextResponse.json({ success: true });
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const raw = await request.json();
  const parsed = onboardingPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const serviceClient = getServiceClient();

  // Save goals if provided
  if (parsed.data.monthlySavingsTarget || parsed.data.retirementAgeTarget) {
    await serviceClient
      .from('goals')
      .upsert({
        user_id: user.id,
        monthly_savings_target: parsed.data.monthlySavingsTarget || null,
        retirement_age_target: parsed.data.retirementAgeTarget || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }

  // Mark onboarding as complete
  await serviceClient
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_step: 3,
    })
    .eq('id', user.id);

  return NextResponse.json({ success: true });
});
