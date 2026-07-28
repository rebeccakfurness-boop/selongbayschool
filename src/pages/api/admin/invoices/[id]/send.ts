import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendInvoiceEmail } from '@/lib/email';
import { InvoiceDocument, type InvoiceData, type InvoiceLineItemData, type SchoolSettingsData } from '@/lib/pdf/InvoiceDocument';

/** Lives under the Pages Router — see /api/invoices/:id/pdf.ts for why (App Router route handlers
 * trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler; Pages
 * Router API routes don't).
 *
 * src/proxy.ts's matcher covers /api/admin/:path* regardless of app/pages router, so it already
 * guarantees a logged-in staff member here — same as every other /api/admin/* route — but role
 * (admin vs teacher) still needs checking directly since requireAdmin()'s redirect() is an App
 * Router API that doesn't work from a Pages Router handler. */
const bodySchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid invoice id.' });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
    return;
  }

  try {
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

    const lineItems = (await sql`
      SELECT child_id, description, quantity, unit_price, line_total FROM invoice_line_items
      WHERE invoice_id = ${id} ORDER BY child_id, sort_order
    `) as unknown as InvoiceLineItemData[];
    const [settings] = (await sql`SELECT * FROM school_settings WHERE id = 1`) as unknown as SchoolSettingsData[];

    const pdfBuffer = await renderToBuffer(InvoiceDocument({ invoice, lineItems, settings }));

    const sent = await sendInvoiceEmail({
      toEmail: parsed.data.email,
      billedToName: invoice.billed_to_name,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      totalAmount: invoice.total_amount,
      currency: invoice.currency,
      dueDate: invoice.due_date,
      pdfBuffer,
    });

    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id/send] failed', err);
    res.status(500).json({ error: `Could not send invoice: ${err instanceof Error ? err.message : String(err)}` });
  }
}
