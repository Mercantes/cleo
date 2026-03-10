import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = getServiceClient();
  const { data } = await serviceClient
    .from('profiles')
    .select('onboarding_step, onboarding_completed, onboarding_skipped_steps')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    step: data?.onboarding_step || 0,
    completed: data?.onboarding_completed || false,
    skippedSteps: data?.onboarding_skipped_steps || [],
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const serviceClient = getServiceClient();
  const update: Record<string, unknown> = {};

  if (typeof body.step === 'number') {
    update.onboarding_step = body.step;
  }
  if (typeof body.completed === 'boolean') {
    update.onboarding_completed = body.completed;
  }
  if (Array.isArray(body.skippedSteps)) {
    update.onboarding_skipped_steps = body.skippedSteps;
  }

  await serviceClient
    .from('profiles')
    .update(update)
    .eq('id', user.id);

  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const serviceClient = getServiceClient();

  // Save goals if provided
  if (body.monthlySavingsTarget || body.retirementAgeTarget) {
    await serviceClient
      .from('goals')
      .upsert({
        user_id: user.id,
        monthly_savings_target: body.monthlySavingsTarget || null,
        retirement_age_target: body.retirementAgeTarget || null,
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
}
