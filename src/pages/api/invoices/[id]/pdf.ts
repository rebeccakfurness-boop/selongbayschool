import type { NextApiRequest, NextApiResponse } from 'next';
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

/** This route (and its two siblings that render a PDF) lives under the Pages Router rather than
 * the App Router. @react-pdf/renderer's bundled reconciler throws "Minified React error #31"
 * (Objects are not valid as a React child) when rendered from inside an App Router route handler
 * — the same component tree renders fine via a plain Node/tsx script, and fine from a Pages
 * Router API route, so it's specific to how the App Router bundles/aliases React for its route
 * handlers, not a bug in this component tree. Moving PDF rendering here sidesteps it entirely.
 *
 * Same reasoning as /api/learning-profiles/:id/pdf — not covered by src/proxy.ts (its matcher is
 * path-based, but only lists /api/admin/:path*), so admin, any guardian of a billed child, or the
 * billed child's own student login can all reach it, and authorization is checked directly here. */
async function isAuthorized(req: NextApiRequest, res: NextApiResponse, childIds: number[]): Promise<boolean> {
  const adminSession = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (adminSession.adminUserId) return true; // invoicing is admin-only to create, but any staff may view

  const customerSession = await getIronSession<CustomerSessionData>(req, res, await getCustomerSessionOptions());
  if (customerSession.customerId) {
    const rows = await sql`
      SELECT 1 FROM guardian_children WHERE customer_id = ${customerSession.customerId} AND child_id = ANY(${childIds})
    `;
    if (rows.length > 0) return true;
  }

  const studentSession = await getIronSession<StudentSessionData>(req, res, await getStudentSessionOptions());
  if (studentSession.studentAccountId && studentSession.childId && childIds.includes(studentSession.childId)) return true;

  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid invoice id.' });
    return;
  }

  await ensureSchema();

  const invoices = (await sql`
    SELECT id, invoice_number, invoice_type, billed_to_name, issue_date::text, due_date::text,
      currency, subtotal_amount, sibling_discount_amount, total_amount, status, notes
    FROM invoices WHERE id = ${id}
  `) as unknown as InvoiceData[];
  const invoice = invoices[0];
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found.' });
    return;
  }

  const childRows = (await sql`SELECT child_id FROM invoice_children WHERE invoice_id = ${id}`) as unknown as {
    child_id: number;
  }[];
  const childIds = childRows.map((r) => r.child_id);

  if (!(await isAuthorized(req, res, childIds))) {
    res.status(403).json({ error: 'Not authorized to view this invoice.' });
    return;
  }

  const lineItems = (await sql`
    SELECT child_id, description, quantity, unit_price, line_total FROM invoice_line_items
    WHERE invoice_id = ${id} ORDER BY child_id, sort_order
  `) as unknown as InvoiceLineItemData[];

  const [settings] = (await sql`SELECT * FROM school_settings WHERE id = 1`) as unknown as SchoolSettingsData[];

  try {
    const buffer = await renderToBuffer(InvoiceDocument({ invoice, lineItems, settings }));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoice_number}.pdf"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/invoices/:id/pdf] failed to render', err);
    // Admin-only internal route, so it's fine to return the real error rather than a generic
    // message — this is what actually let the missing-asset PDF bug get diagnosed and fixed.
    res.status(500).json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` });
  }
}
