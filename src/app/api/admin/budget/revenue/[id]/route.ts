import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { logRevenueSchema } from '@/lib/validation';
import { updateRevenueEntry, deleteRevenueEntry } from '@/lib/budget';

/** Corrects a revenue entry the Transaction Log shows as already coded -- a miscategorized
 * amount, payer name, or date doesn't have to stay wrong forever just because it was already
 * saved once. Leaves any invoice match alone (see updateRevenueEntry's own comment). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: 'Invalid revenue entry id.' }, { status: 400 });
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
    await updateRevenueEntry(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/revenue/:id] failed to update', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save changes.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: 'Invalid revenue entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteRevenueEntry(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/revenue/:id] failed to delete', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not delete this entry.' }, { status: 500 });
  }
}
