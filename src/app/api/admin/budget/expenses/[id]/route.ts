import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { logExpenseSchema } from '@/lib/validation';
import { updateExpenseEntry, deleteExpenseEntry } from '@/lib/budget';

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
    return NextResponse.json({ error: 'Invalid expense entry id.' }, { status: 400 });
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
    await updateExpenseEntry(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/expenses/:id] failed to update', err);
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
    return NextResponse.json({ error: 'Invalid expense entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteExpenseEntry(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/expenses/:id] failed to delete', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not delete this entry.' }, { status: 500 });
  }
}
