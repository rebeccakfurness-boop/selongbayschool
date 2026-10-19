import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import CreditNoteForm from '@/components/admin/CreditNoteForm';

export const dynamic = 'force-dynamic';

export default async function NewCreditNotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) notFound();

  const rows = await sql`SELECT child_full_name, child_nickname FROM children WHERE id = ${childId}`;
  const child = rows[0];
  if (!child) notFound();
  const label = (child.child_nickname as string) || (child.child_full_name as string);

  const invoiceRows = (await sql`
    SELECT i.id, i.invoice_number, i.invoice_type
    FROM invoices i JOIN invoice_children ic ON ic.invoice_id = i.id
    WHERE ic.child_id = ${childId}
    ORDER BY i.issue_date DESC
  `) as unknown as { id: number; invoice_number: number; invoice_type: string }[];
  const invoiceOptions = invoiceRows.map((r) => ({ id: Number(r.id), invoiceNumber: Number(r.invoice_number), invoiceType: r.invoice_type }));

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">New credit note: {label}</h1>
      <div className="mt-6">
        <CreditNoteForm childId={childId} childLabel={label} invoiceOptions={invoiceOptions} redirectTo={`/admin/families/${childId}`} />
      </div>
    </section>
  );
}
