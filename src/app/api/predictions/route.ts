import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { predictNextMonth } from '@/lib/finance/prediction-engine';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prediction = await predictNextMonth(user.id);

  // Resolve category names if predictions exist
  if (prediction.category_predictions.length > 0) {
    const admin = createAdminClient();
    const catIds = prediction.category_predictions.map((p) => p.category_id);
    const { data: categories } = await admin.from('categories').select('id, name').in('id', catIds);

    if (categories) {
      const nameMap = new Map(categories.map((c: { id: string; name: string }) => [c.id, c.name]));
      for (const pred of prediction.category_predictions) {
        pred.category_name = nameMap.get(pred.category_id) || pred.category_name;
      }
    }
  }

  return NextResponse.json(prediction);
}
