import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { logRevenueSchema } from '@/lib/validation';
import { createRevenueEntry } from '@/lib/budget';

export async function POST(req: NextRequest) {
  let staff;
  try {
    staff = await requireBudgetUnlocked();
  } catch (err) {
    if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
      return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = logRevenueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid revenue entry.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createRevenueEntry(parsed.data, staff.adminUserId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/budget/revenue] failed to create', err);
    return NextResponse.json({ error: 'Could not save revenue entry.' }, { status: 500 });
  }
}
