import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateInvoiceStatusSchema, createInvoiceSchema } from '@/lib/validation';
import { computeInvoiceTotals } from '@/lib/invoice-calc';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  await ensureSchema();
  const invoices = await sql`
    SELECT id, invoice_number, invoice_type, billed_to_name, issue_date::text, due_date::text,
      currency, subtotal_amount, sibling_discount_amount, total_amount, status, notes
    FROM invoices WHERE id = ${id}
  `;
  const invoice = invoices[0];
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const children = await sql`
    SELECT ic.child_id, ic.sort_order, COALESCE(c.child_nickname, c.child_full_name) AS label
    FROM invoice_children ic JOIN children c ON c.id = ic.child_id
    WHERE ic.invoice_id = ${id} ORDER BY ic.sort_order
  `;
  const lineItems = await sql`
    SELECT child_id, description, quantity, unit_price FROM invoice_line_items
    WHERE invoice_id = ${id} ORDER BY child_id, sort_order
  `;

  return NextResponse.json({ invoice, children, lineItems });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateInvoiceStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid status.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE invoices SET
        status = ${parsed.data.status},
        paid_at = CASE WHEN ${parsed.data.status} = 'paid' THEN now() ELSE NULL END
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id] failed to update status', err);
    return NextResponse.json({ error: 'Could not update invoice.' }, { status: 500 });
  }
}

/** Full content replace (billed-to, issue date, line items, notes) — a separate verb from PATCH
 * (status-only) so "mark as paid" and "edit the content" can never accidentally collide. Recomputes
 * subtotal/discount/total the same way creation does (via the shared computeInvoiceTotals), and
 * replaces invoice_children/invoice_line_items wholesale rather than trying to diff them.
 * invoice_number and status are left untouched. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid invoice.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const existing = await sql`SELECT id FROM invoices WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    const [settings] = await sql`SELECT invoice_due_days FROM school_settings WHERE id = 1`;
    const dueDays = (settings?.invoice_due_days as number) ?? 5;

    const { subtotal, siblingDiscountTotal, total, childTotals } = computeInvoiceTotals(d.children);

    await sql`
      UPDATE invoices SET
        invoice_type = ${d.invoiceType},
        billed_to_name = ${d.billedToName},
        issue_date = ${d.issueDate}::date,
        due_date = (${d.issueDate}::date + (${dueDays} || ' days')::interval)::date,
        subtotal_amount = ${subtotal},
        sibling_discount_amount = ${siblingDiscountTotal},
        total_amount = ${total},
        notes = ${d.notes ?? null}
      WHERE id = ${id}
    `;

    await sql`DELETE FROM invoice_children WHERE invoice_id = ${id}`;
    await sql`DELETE FROM invoice_line_items WHERE invoice_id = ${id}`;

    let sortOrder = 0;
    for (const child of childTotals) {
      await sql`
        INSERT INTO invoice_children (invoice_id, child_id, discount_percent, sort_order)
        VALUES (${id}, ${child.childId}, ${child.discountPercent}, ${sortOrder})
      `;
      let liSortOrder = 0;
      for (const li of child.lineItems) {
        const lineTotal = Math.round(li.quantity * li.unitPrice);
        await sql`
          INSERT INTO invoice_line_items (invoice_id, child_id, description, quantity, unit_price, line_total, sort_order)
          VALUES (${id}, ${child.childId}, ${li.description}, ${li.quantity}, ${li.unitPrice}, ${lineTotal}, ${liSortOrder})
        `;
        liSortOrder++;
      }
      sortOrder++;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id] failed to update content', err);
    return NextResponse.json({ error: 'Could not save invoice.' }, { status: 500 });
  }
}

/** Hard delete — removes the invoice row entirely (invoice_children and invoice_line_items
 * cascade via their FK; any lunch_orders pointing at it just have invoice_id set to NULL). This
 * is distinct from voiding (PATCH status='cancelled'), which keeps the invoice on record but
 * marked as not owed — use delete only for invoices that should never have existed. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`DELETE FROM invoices WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete invoice.' }, { status: 500 });
  }
}
