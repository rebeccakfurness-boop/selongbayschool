import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import {
  getSessionOptions,
  getCustomerSessionOptions,
  getStudentSessionOptions,
  type AdminSessionData,
  type CustomerSessionData,
  type StudentSessionData,
} from '@/lib/auth';
import { InvoiceDocument, type InvoiceData, type InvoiceLineItemData, type SchoolSettingsData } from '@/lib/pdf/InvoiceDocument';

/** Same reasoning as /api/learning-profiles/:id/pdf — not covered by src/proxy.ts, so admin,
 * any guardian of a billed child, or the billed child's own student login can all reach it, and
 * authorization is checked directly here for each case. */
async function isAuthorized(childIds: number[]): Promise<boolean> {
  const jar = await cookies();

  const adminSession = await getIronSession<AdminSessionData>(jar, await getSessionOptions());
  if (adminSession.adminUserId) return true; // invoicing is admin-only to create, but any staff may view

  const customerSession = await getIronSession<CustomerSessionData>(jar, await getCustomerSessionOptions());
  if (customerSession.customerId) {
    const rows = await sql`
      SELECT 1 FROM guardian_children WHERE customer_id = ${customerSession.customerId} AND child_id = ANY(${childIds})
    `;
    if (rows.length > 0) return true;
  }

  const studentSession = await getIronSession<StudentSessionData>(jar, await getStudentSessionOptions());
  if (studentSession.studentAccountId && studentSession.childId && childIds.includes(studentSession.childId)) return true;

  return false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  await ensureSchema();

  const invoices = (await sql`SELECT * FROM invoices WHERE id = ${id}`) as unknown as InvoiceData[];
  const invoice = invoices[0];
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const childRows = (await sql`SELECT child_id FROM invoice_children WHERE invoice_id = ${id}`) as unknown as {
    child_id: number;
  }[];
  const childIds = childRows.map((r) => r.child_id);

  if (!(await isAuthorized(childIds))) {
    return NextResponse.json({ error: 'Not authorized to view this invoice.' }, { status: 403 });
  }

  const lineItems = (await sql`
    SELECT child_id, description, quantity, unit_price, line_total FROM invoice_line_items
    WHERE invoice_id = ${id} ORDER BY child_id, sort_order
  `) as unknown as InvoiceLineItemData[];

  const [settings] = (await sql`SELECT * FROM school_settings WHERE id = 1`) as unknown as SchoolSettingsData[];

  try {
    const buffer = await renderToBuffer(InvoiceDocument({ invoice, lineItems, settings }));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[api/invoices/:id/pdf] failed to render', err);
    // Admin-only internal route, so it's fine to return the real error rather than a generic
    // message — this is what actually let the missing-asset PDF bug get diagnosed and fixed.
    return NextResponse.json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
