import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { logExpenseSchema } from '@/lib/validation';
import { createExpenseEntry } from '@/lib/budget';

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

  const parsed = logExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid expense entry.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createExpenseEntry(parsed.data, staff.adminUserId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/budget/expenses] failed to create', err);
    return NextResponse.json({ error: 'Could not save expense entry.' }, { status: 500 });
  }
}
