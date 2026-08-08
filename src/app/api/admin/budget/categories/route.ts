import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { createBudgetCategorySchema } from '@/lib/validation';
import { createBudgetCategory } from '@/lib/budget';

export async function POST(req: NextRequest) {
  try {
    await requireBudgetUnlocked();
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

  const parsed = createBudgetCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid category.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createBudgetCategory(parsed.data.name, parsed.data.monthlyBudgetIdr);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/budget/categories] failed to create', err);
    return NextResponse.json({ error: 'Could not create category — the name may already exist.' }, { status: 500 });
  }
}
