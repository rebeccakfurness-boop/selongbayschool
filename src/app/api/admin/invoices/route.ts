import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createInvoiceSchema } from '@/lib/validation';

/**
 * Sibling discount: only applies when 2+ children are billed on the same invoice (per the
 * brief's "when multiple siblings are billed together"); a single-child invoice gets 0%. Among
 * billed children, the first one added gets 5% off their own line items, every additional child
 * gets 10% off theirs — confirmed with the school; nothing in the source spreadsheet or sample
 * invoices defined an actual schedule, so this is the one place that rule is encoded.
 */
function siblingDiscountPercent(index: number, totalChildren: number): number {
  if (totalChildren < 2) return 0;
  return index === 0 ? 5 : 10;
}

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

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

    const [settings] = await sql`SELECT invoice_due_days FROM school_settings WHERE id = 1`;
    const dueDays = (settings?.invoice_due_days as number) ?? 5;

    const [{ nextval: invoiceNumber }] = (await sql`SELECT nextval('invoice_number_seq') AS nextval`) as unknown as {
      nextval: number;
    }[];

    let subtotal = 0;
    let siblingDiscountTotal = 0;
    const childTotals: { childId: number; discountPercent: number; lineItems: typeof d.children[number]['lineItems'] }[] = [];

    d.children.forEach((child, index) => {
      const discountPercent = siblingDiscountPercent(index, d.children.length);
      const childSubtotal = child.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
      subtotal += childSubtotal;
      siblingDiscountTotal += Math.round((childSubtotal * discountPercent) / 100);
      childTotals.push({ childId: child.childId, discountPercent, lineItems: child.lineItems });
    });

    const total = subtotal - siblingDiscountTotal;

    const invoiceRows = await sql`
      INSERT INTO invoices (invoice_number, invoice_type, billed_to_name, issue_date, due_date, subtotal_amount, sibling_discount_amount, total_amount, notes, created_by)
      VALUES (
        ${invoiceNumber}, ${d.invoiceType}, ${d.billedToName}, ${d.issueDate}::date,
        (${d.issueDate}::date + (${dueDays} || ' days')::interval)::date,
        ${subtotal}, ${siblingDiscountTotal}, ${total}, ${d.notes ?? null}, ${staff.adminUserId}
      )
      RETURNING id
    `;
    const invoiceId = invoiceRows[0].id as number;

    let sortOrder = 0;
    for (const child of childTotals) {
      await sql`
        INSERT INTO invoice_children (invoice_id, child_id, discount_percent, sort_order)
        VALUES (${invoiceId}, ${child.childId}, ${child.discountPercent}, ${sortOrder})
      `;
      let liSortOrder = 0;
      for (const li of child.lineItems) {
        const lineTotal = Math.round(li.quantity * li.unitPrice);
        await sql`
          INSERT INTO invoice_line_items (invoice_id, child_id, description, quantity, unit_price, line_total, sort_order)
          VALUES (${invoiceId}, ${child.childId}, ${li.description}, ${li.quantity}, ${li.unitPrice}, ${lineTotal}, ${liSortOrder})
        `;
        liSortOrder++;
      }
      sortOrder++;
    }

    return NextResponse.json({ id: invoiceId, invoiceNumber });
  } catch (err) {
    console.error('[api/admin/invoices] failed to create', err);
    return NextResponse.json({ error: 'Could not create invoice.' }, { status: 500 });
  }
}
