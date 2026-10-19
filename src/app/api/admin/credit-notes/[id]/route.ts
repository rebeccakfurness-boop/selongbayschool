import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { creditNoteActionSchema } from '@/lib/validation';
import { markCreditNoteRefunded, cancelCreditNote } from '@/lib/credit-notes';

const OUTCOME_ERRORS: Record<string, string> = {
  not_found: 'Credit note not found.',
  wrong_kind: 'Only a refund credit note can be marked refunded.',
  not_open: 'This credit note is no longer open.',
};

/** Single action endpoint (mark_refunded / cancel) rather than a general PATCH -- a credit note
 * has no freely-editable fields once issued, only these two terminal transitions (plus "apply",
 * which is its own route since it also needs an invoice id and amount). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
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

  const parsed = creditNoteActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid action.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const outcome = parsed.data.action === 'mark_refunded' ? await markCreditNoteRefunded(id) : await cancelCreditNote(id);
    if (!outcome.ok) {
      return NextResponse.json({ error: OUTCOME_ERRORS[outcome.reason] || 'Could not update credit note.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/credit-notes/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update credit note.' }, { status: 500 });
  }
}
