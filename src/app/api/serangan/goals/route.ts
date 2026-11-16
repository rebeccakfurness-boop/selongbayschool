import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { upsertSeranganGoalSchema } from '@/lib/validation';
import { createGoal } from '@/lib/serangan';

export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid goal.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createGoal(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/serangan/goals] failed to create', err);
    return NextResponse.json({ error: 'Could not save that goal.' }, { status: 500 });
  }
}
