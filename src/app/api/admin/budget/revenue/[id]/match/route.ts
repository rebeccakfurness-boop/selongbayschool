import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { matchRevenueToInvoiceSchema } from '@/lib/validation';
import { matchRevenueToInvoice, unmatchRevenueFromInvoice } from '@/lib/budget';

/** Reconciles one revenue entry against an outstanding invoice, marking that invoice paid in the
 * same action -- the Xero-style "match transactions to invoices" step. */
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
  const revenueId = Number(idParam);
  if (!Number.isInteger(revenueId)) {
    return NextResponse.json({ error: 'Invalid revenue entry id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = matchRevenueToInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Choose an invoice.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await matchRevenueToInvoice(revenueId, parsed.data.invoiceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // A UNIQUE-constraint violation here means someone else matched the same invoice a moment
    // earlier (two admins working the same reconciliation at once) -- a clear message beats a raw
    // Postgres error either way.
    const message = err instanceof Error && /duplicate key|unique constraint/i.test(err.message)
      ? 'That invoice was just matched to a different entry.'
      : err instanceof Error ? err.message : 'Could not match this entry to that invoice.';
    console.error('[api/admin/budget/revenue/:id/match] failed', err);
    return NextResponse.json({ error: message }, { status: 500 });
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
  const revenueId = Number(idParam);
  if (!Number.isInteger(revenueId)) {
    return NextResponse.json({ error: 'Invalid revenue entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await unmatchRevenueFromInvoice(revenueId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/revenue/:id/match] failed to unmatch', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not unmatch this entry.' }, { status: 500 });
  }
}
