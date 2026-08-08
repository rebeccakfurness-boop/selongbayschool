import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { updateBudgetCategorySchema } from '@/lib/validation';
import { updateCategoryBudget } from '@/lib/budget';

/** Deliberate override, not a silent edit — see updateCategoryBudget in lib/budget.ts, which logs
 * the old/new value and who made the change before applying it. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let staff;
  try {
    staff = await requireBudgetUnlocked();
  } catch (err) {
    if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
      return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
    }
    throw err;
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateBudgetCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid amount.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateCategoryBudget(id, parsed.data.monthlyBudgetIdr, staff.adminUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/categories/:id] failed to update', err);
    return NextResponse.json({ error: `Could not update category: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
