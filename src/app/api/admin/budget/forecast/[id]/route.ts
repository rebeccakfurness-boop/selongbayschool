import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { upsertBudgetForecastEntrySchema } from '@/lib/validation';
import { updateForecastEntry, deleteForecastEntry } from '@/lib/budget';

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
    return NextResponse.json({ error: 'Invalid forecast entry id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = upsertBudgetForecastEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid forecast entry.' }, { status: 400 });
  }
  if (parsed.data.entryType === 'expense' && !parsed.data.categoryId) {
    return NextResponse.json({ error: 'Choose a category for an expense estimate.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateForecastEntry(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/forecast/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save forecast entry.' }, { status: 500 });
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
    return NextResponse.json({ error: 'Invalid forecast entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteForecastEntry(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/forecast/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete forecast entry.' }, { status: 500 });
  }
}
