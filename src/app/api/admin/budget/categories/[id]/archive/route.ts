import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { setBudgetCategoryArchived } from '@/lib/budget';

/** Toggles archived — body: { archived: boolean } — rather than a hard delete, so historical
 * revenue/expense entries already coded to this category keep their category name intact. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireBudgetUnlocked();
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
    body = {};
  }
  const archived = Boolean((body as { archived?: unknown }).archived);

  try {
    await ensureSchema();
    await setBudgetCategoryArchived(id, archived);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/categories/:id/archive] failed', err);
    return NextResponse.json({ error: 'Could not update category.' }, { status: 500 });
  }
}
