import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { applyCreditNoteSchema } from '@/lib/validation';
import { applyCreditNoteToInvoice } from '@/lib/credit-notes';

const OUTCOME_ERRORS: Record<string, string> = {
  not_found: 'Credit note not found.',
  not_available: 'This credit note is not an open credit hold.',
  exceeds_remaining: "That's more than this credit note has remaining.",
  invoice_not_outstanding: 'That invoice is not outstanding.',
  wrong_child: "That invoice isn't billed to this credit note's child.",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid credit note id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = applyCreditNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const outcome = await applyCreditNoteToInvoice(id, parsed.data.invoiceId, parsed.data.amountIdr, staff.adminUserId);
    if (!outcome.ok) {
      return NextResponse.json({ error: OUTCOME_ERRORS[outcome.reason] || 'Could not apply credit note.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, amountApplied: outcome.amountApplied });
  } catch (err) {
    console.error('[api/admin/credit-notes/:id/apply] failed', err);
    return NextResponse.json({ error: 'Could not apply credit note.' }, { status: 500 });
  }
}
