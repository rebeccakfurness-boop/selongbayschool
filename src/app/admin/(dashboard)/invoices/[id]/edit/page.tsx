import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import InvoiceForm, { type ChildEntry } from '@/components/admin/InvoiceForm';

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const invoices = (await sql`
    SELECT invoice_number, invoice_type, billed_to_name, issue_date::text
    FROM invoices WHERE id = ${id}
  `) as unknown as {
    invoice_number: number;
    invoice_type: 'tuition' | 'activity';
    billed_to_name: string;
    issue_date: string;
  }[];
  const invoice = invoices[0];
  if (!invoice) notFound();

  const childRows = (await sql`
    SELECT ic.child_id, ic.sort_order, COALESCE(c.child_nickname, c.child_full_name) AS label
    FROM invoice_children ic JOIN children c ON c.id = ic.child_id
    WHERE ic.invoice_id = ${id} ORDER BY ic.sort_order
  `) as unknown as { child_id: number; label: string }[];

  const lineItemRows = (await sql`
    SELECT child_id, description, quantity, unit_price FROM invoice_line_items
    WHERE invoice_id = ${id} ORDER BY child_id, sort_order
  `) as unknown as { child_id: number; description: string; quantity: number; unit_price: number }[];

  const initialChildren: ChildEntry[] = childRows.map((c) => ({
    childId: c.child_id,
    label: c.label,
    lineItems: lineItemRows
      .filter((li) => li.child_id === c.child_id)
      .map((li) => ({ description: li.description, quantity: String(li.quantity), unitPrice: String(li.unit_price) })),
  }));

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Edit Invoice #{String(invoice.invoice_number).padStart(3, '0')}
      </h1>
      <div className="mt-6">
        <InvoiceForm
          invoiceId={id}
          initialInvoiceType={invoice.invoice_type}
          initialBilledToName={invoice.billed_to_name}
          initialIssueDate={invoice.issue_date.slice(0, 10)}
          initialChildren={initialChildren}
          redirectTo="/admin/invoices"
        />
      </div>
    </section>
  );
}
