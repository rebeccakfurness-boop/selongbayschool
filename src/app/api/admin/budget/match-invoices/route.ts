import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { getMatchableInvoices } from '@/lib/budget';

/** Candidate list for the "Match to invoice" picker on one revenue entry -- ?amount is the
 * entry's own amount (used to float an exact-amount match to the top), ?query an optional
 * free-text search over billed-to name / invoice number. */
export async function GET(req: NextRequest) {
  try {
    await requireBudgetUnlocked();
  } catch (err) {
    if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
      return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
    }
    throw err;
  }

  const amountParam = req.nextUrl.searchParams.get('amount');
  const amount = Number(amountParam);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'A valid amount is required.' }, { status: 400 });
  }
  const query = req.nextUrl.searchParams.get('query');

  try {
    await ensureSchema();
    const invoices = await getMatchableInvoices(amount, query);
    return NextResponse.json({ invoices });
  } catch (err) {
    console.error('[api/admin/budget/match-invoices] failed', err);
    return NextResponse.json({ error: 'Could not load invoices.' }, { status: 500 });
  }
}
