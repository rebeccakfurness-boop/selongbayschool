import { sql } from './db';
import type { CreateCreditNoteInput } from './validation';

export interface CreditNoteApplicationRow {
  id: number;
  invoice_id: number;
  invoice_number: number;
  amount_idr: number;
  applied_at: string;
}

export interface CreditNoteRow {
  id: number;
  credit_note_number: number;
  child_id: number;
  child_full_name: string;
  original_invoice_id: number | null;
  original_invoice_number: number | null;
  kind: 'refund' | 'credit_hold';
  reason: string;
  amount_idr: number;
  remaining_idr: number;
  status: 'open' | 'applied' | 'refunded' | 'cancelled';
  issued_at: string;
  resolved_at: string | null;
  notes: string | null;
  applications: CreditNoteApplicationRow[];
}

async function loadApplications(creditNoteId: number): Promise<CreditNoteApplicationRow[]> {
  return ((await sql`
    SELECT cna.id, cna.invoice_id, inv.invoice_number, cna.amount_idr, cna.applied_at::text
    FROM credit_note_applications cna
    JOIN invoices inv ON inv.id = cna.invoice_id
    WHERE cna.credit_note_id = ${creditNoteId}
    ORDER BY cna.applied_at
  `) as unknown as CreditNoteApplicationRow[]).map((a) => ({
    ...a,
    id: Number(a.id),
    invoice_id: Number(a.invoice_id),
    invoice_number: Number(a.invoice_number),
    amount_idr: Number(a.amount_idr),
  }));
}

function normalizeCreditNoteRow<T extends { id: unknown; child_id: unknown; original_invoice_id: unknown; original_invoice_number: unknown; amount_idr: unknown; remaining_idr: unknown }>(
  r: T
): T {
  return {
    ...r,
    id: Number(r.id),
    child_id: Number(r.child_id),
    original_invoice_id: r.original_invoice_id != null ? Number(r.original_invoice_id) : null,
    original_invoice_number: r.original_invoice_number != null ? Number(r.original_invoice_number) : null,
    amount_idr: Number(r.amount_idr),
    remaining_idr: Number(r.remaining_idr),
  };
}

export async function createCreditNote(
  input: CreateCreditNoteInput,
  issuedBy: number
): Promise<{ id: number; creditNoteNumber: number }> {
  const [{ nextval: creditNoteNumber }] = (await sql`SELECT nextval('credit_note_number_seq') AS nextval`) as unknown as {
    nextval: number;
  }[];

  const rows = await sql`
    INSERT INTO credit_notes (credit_note_number, child_id, original_invoice_id, kind, reason, amount_idr, remaining_idr, issued_by)
    VALUES (
      ${creditNoteNumber}, ${input.childId}, ${input.originalInvoiceId ?? null}, ${input.kind}, ${input.reason},
      ${input.amountIdr}, ${input.amountIdr}, ${issuedBy}
    )
    RETURNING id
  `;
  return { id: rows[0].id as number, creditNoteNumber };
}

export async function getCreditNoteById(id: number): Promise<CreditNoteRow | null> {
  const rows = ((await sql`
    SELECT cn.id, cn.credit_note_number, cn.child_id, COALESCE(c.child_nickname, c.child_full_name) AS child_full_name,
      cn.original_invoice_id, inv.invoice_number AS original_invoice_number,
      cn.kind, cn.reason, cn.amount_idr, cn.remaining_idr, cn.status,
      cn.issued_at::text, cn.resolved_at::text, cn.notes
    FROM credit_notes cn
    JOIN children c ON c.id = cn.child_id
    LEFT JOIN invoices inv ON inv.id = cn.original_invoice_id
    WHERE cn.id = ${id}
  `) as unknown as Omit<CreditNoteRow, 'applications'>[]).map(normalizeCreditNoteRow);
  const row = rows[0];
  if (!row) return null;
  return { ...row, applications: await loadApplications(row.id) };
}

export async function getCreditNotesForChild(childId: number): Promise<CreditNoteRow[]> {
  const rows = ((await sql`
    SELECT cn.id, cn.credit_note_number, cn.child_id, COALESCE(c.child_nickname, c.child_full_name) AS child_full_name,
      cn.original_invoice_id, inv.invoice_number AS original_invoice_number,
      cn.kind, cn.reason, cn.amount_idr, cn.remaining_idr, cn.status,
      cn.issued_at::text, cn.resolved_at::text, cn.notes
    FROM credit_notes cn
    JOIN children c ON c.id = cn.child_id
    LEFT JOIN invoices inv ON inv.id = cn.original_invoice_id
    WHERE cn.child_id = ${childId}
    ORDER BY cn.issued_at DESC
  `) as unknown as Omit<CreditNoteRow, 'applications'>[]).map(normalizeCreditNoteRow);

  const result: CreditNoteRow[] = [];
  for (const row of rows) {
    result.push({ ...row, applications: await loadApplications(row.id) });
  }
  return result;
}

export interface CreditNoteAdminRow {
  id: number;
  credit_note_number: number;
  child_id: number;
  child_full_name: string;
  kind: 'refund' | 'credit_hold';
  reason: string;
  amount_idr: number;
  remaining_idr: number;
  status: 'open' | 'applied' | 'refunded' | 'cancelled';
  issued_at: string;
  default_email: string | null;
}

export async function getAllCreditNotesForAdmin(): Promise<CreditNoteAdminRow[]> {
  return ((await sql`
    SELECT cn.id, cn.credit_note_number, cn.child_id, COALESCE(c.child_nickname, c.child_full_name) AS child_full_name,
      cn.kind, cn.reason, cn.amount_idr, cn.remaining_idr, cn.status, cn.issued_at::text, c.primary_contact_email AS default_email
    FROM credit_notes cn
    JOIN children c ON c.id = cn.child_id
    ORDER BY cn.issued_at DESC
  `) as unknown as CreditNoteAdminRow[]).map((r) => ({
    ...r,
    id: Number(r.id),
    child_id: Number(r.child_id),
    amount_idr: Number(r.amount_idr),
    remaining_idr: Number(r.remaining_idr),
  }));
}

/** Credit holds this child can still draw on -- what the "apply to invoice" picker offers. */
export async function getOpenCreditHoldsForChild(childId: number): Promise<CreditNoteRow[]> {
  const all = await getCreditNotesForChild(childId);
  return all.filter((cn) => cn.kind === 'credit_hold' && cn.status === 'open' && cn.remaining_idr > 0);
}

export type ApplyCreditNoteOutcome =
  | { ok: true; amountApplied: number }
  | { ok: false; reason: 'not_found' | 'not_available' | 'exceeds_remaining' | 'invoice_not_outstanding' | 'wrong_child' };

/** Draws down a credit_hold note's balance against one outstanding invoice for the same child.
 * Doesn't touch invoices.total_amount -- the invoice keeps its own billed amount, and "amount
 * due" (total minus everything applied) is computed at read time by summing this table, same way
 * budget.ts treats matched_invoice_id rather than mutating the invoice itself. */
export async function applyCreditNoteToInvoice(
  creditNoteId: number,
  invoiceId: number,
  amountIdr: number,
  appliedBy: number
): Promise<ApplyCreditNoteOutcome> {
  const creditRows = (await sql`
    SELECT child_id, kind, status, remaining_idr FROM credit_notes WHERE id = ${creditNoteId}
  `) as unknown as { child_id: number; kind: string; status: string; remaining_idr: number }[];
  const credit = creditRows[0];
  if (!credit) return { ok: false, reason: 'not_found' };
  if (credit.kind !== 'credit_hold' || credit.status !== 'open') return { ok: false, reason: 'not_available' };
  if (amountIdr > Number(credit.remaining_idr)) return { ok: false, reason: 'exceeds_remaining' };

  const invoiceRows = (await sql`
    SELECT status FROM invoices WHERE id = ${invoiceId} AND id IN (SELECT invoice_id FROM invoice_children WHERE child_id = ${credit.child_id})
  `) as unknown as { status: string }[];
  if (invoiceRows.length === 0) return { ok: false, reason: 'wrong_child' };
  if (invoiceRows[0].status !== 'outstanding') return { ok: false, reason: 'invoice_not_outstanding' };

  await sql`
    INSERT INTO credit_note_applications (credit_note_id, invoice_id, amount_idr, applied_by)
    VALUES (${creditNoteId}, ${invoiceId}, ${amountIdr}, ${appliedBy})
  `;

  const remaining = Number(credit.remaining_idr) - amountIdr;
  await sql`
    UPDATE credit_notes SET
      remaining_idr = ${remaining},
      status = CASE WHEN ${remaining} <= 0 THEN 'applied' ELSE status END,
      resolved_at = CASE WHEN ${remaining} <= 0 THEN now() ELSE resolved_at END
    WHERE id = ${creditNoteId}
  `;

  return { ok: true, amountApplied: amountIdr };
}

/** Reverses every application this invoice received, restoring each credit note's remaining_idr
 * and reopening it if it had been fully drawn down -- called before an invoice is voided or
 * deleted so a credit that was applied to it doesn't just vanish with the invoice. */
export async function releaseCreditApplicationsForInvoice(invoiceId: number): Promise<void> {
  const applications = (await sql`
    SELECT id, credit_note_id, amount_idr FROM credit_note_applications WHERE invoice_id = ${invoiceId}
  `) as unknown as { id: number; credit_note_id: number; amount_idr: number }[];

  for (const app of applications) {
    await sql`
      UPDATE credit_notes SET
        remaining_idr = remaining_idr + ${app.amount_idr},
        status = CASE WHEN status = 'applied' THEN 'open' ELSE status END,
        resolved_at = CASE WHEN status = 'applied' THEN NULL ELSE resolved_at END
      WHERE id = ${app.credit_note_id}
    `;
  }

  await sql`DELETE FROM credit_note_applications WHERE invoice_id = ${invoiceId}`;
}

export type CreditNoteActionOutcome = { ok: true } | { ok: false; reason: 'not_found' | 'wrong_kind' | 'not_open' };

export async function markCreditNoteRefunded(id: number): Promise<CreditNoteActionOutcome> {
  const rows = (await sql`SELECT kind, status FROM credit_notes WHERE id = ${id}`) as unknown as { kind: string; status: string }[];
  const row = rows[0];
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.kind !== 'refund') return { ok: false, reason: 'wrong_kind' };
  if (row.status !== 'open') return { ok: false, reason: 'not_open' };
  await sql`UPDATE credit_notes SET status = 'refunded', resolved_at = now() WHERE id = ${id}`;
  return { ok: true };
}

/** Cancels whatever balance remains unused -- a credit_hold note already partially applied to
 * some invoices keeps those applications; this only writes off what's left in remaining_idr. */
export async function cancelCreditNote(id: number): Promise<CreditNoteActionOutcome> {
  const rows = (await sql`SELECT status FROM credit_notes WHERE id = ${id}`) as unknown as { status: string }[];
  const row = rows[0];
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status !== 'open') return { ok: false, reason: 'not_open' };
  await sql`UPDATE credit_notes SET status = 'cancelled', remaining_idr = 0, resolved_at = now() WHERE id = ${id}`;
  return { ok: true };
}
