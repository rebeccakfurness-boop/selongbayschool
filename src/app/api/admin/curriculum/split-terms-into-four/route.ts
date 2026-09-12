import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { computeTermSplitPlan, applyTermSplitPlan, serializableTermSplitPlan } from '@/lib/curriculum-term-split';

/** Backs the admin "Split into 4 terms" panel on Curriculum Plans -- runs the same logic as
 * scripts/split-terms-into-four.ts, but against this deployment's own database connection (a
 * terminal running that script needs .env.local; this route runs wherever the app itself is
 * already configured, i.e. the real production environment, no separate credentials needed).
 * Admin-only: this restructures real content across every class/subject at once. */
export async function GET() {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can do this.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const plan = await computeTermSplitPlan();
    return NextResponse.json(serializableTermSplitPlan(plan));
  } catch (err) {
    console.error('[api/admin/curriculum/split-terms-into-four] failed to compute plan', err);
    return NextResponse.json({ error: 'Could not compute the split plan.' }, { status: 500 });
  }
}

export async function POST() {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can do this.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const plan = await computeTermSplitPlan();
    const { appliedGroups } = await applyTermSplitPlan(plan);
    return NextResponse.json({ ok: true, appliedGroups, plan: serializableTermSplitPlan(plan) });
  } catch (err) {
    console.error('[api/admin/curriculum/split-terms-into-four] failed to apply', err);
    return NextResponse.json({ error: 'Could not apply the split.' }, { status: 500 });
  }
}
