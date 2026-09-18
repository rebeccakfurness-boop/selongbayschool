import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { createBudgetImportBatchSchema } from '@/lib/validation';
import { createBudgetImportBatch } from '@/lib/budget';

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

  const parsed = createBudgetImportBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid import batch.' }, { status: 400 });
  }
  if (parsed.data.revenue.length === 0 && parsed.data.expenses.length === 0) {
    return NextResponse.json({ error: 'Add at least one revenue or expense row before importing.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result = await createBudgetImportBatch(parsed.data, staff.adminUserId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/admin/budget/import-batches] failed to create', err);
    return NextResponse.json({ error: 'Could not save import batch.' }, { status: 500 });
  }
}
