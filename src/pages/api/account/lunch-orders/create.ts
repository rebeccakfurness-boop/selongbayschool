import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { createLunchOrderSchema } from '@/lib/validation';
import { createLunchOrder } from '@/lib/lunch-orders';
import { sendInvoiceEmail } from '@/lib/email';
import { InvoiceDocument, type InvoiceData, type InvoiceLineItemData, type SchoolSettingsData } from '@/lib/pdf/InvoiceDocument';

interface LunchSettingsRow {
  supplier_name: string;
  payable_to: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  swift_code: string;
  bank_address: string | null;
  bank_code: string | null;
  branch_code: string | null;
  clearing_code: string | null;
  currency: string;
  invoice_due_days: number;
  normal_price_idr: number;
  large_price_idr: number;
}

/** Lives under the Pages Router rather than the App Router for the same reason as
 * /api/invoices/[id]/pdf.ts — @react-pdf/renderer throws under App Router route handlers, and
 * this route needs to render the invoice PDF inline to attach it to the confirmation email
 * (matching sendInvoiceEmail's existing shape, rather than inventing a link-only email just for
 * lunch orders). Not covered by src/proxy.ts (its matcher only lists /api/admin/:path* and
 * /account/:path*, not /api/account/:path*), so the customer session is checked directly here. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<CustomerSessionData>(req, res, await getCustomerSessionOptions());
  if (!session.customerId || !session.email) {
    res.status(403).json({ error: 'Please log in to order lunches.' });
    return;
  }
  const { customerId, email } = session;

  const parsed = createLunchOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lunch order.' });
    return;
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    if (!(await guardianOwnsChild(customerId, d.childId))) {
      res.status(403).json({ error: 'Not authorized to order lunches for this child.' });
      return;
    }

    const [child] = (await sql`SELECT child_full_name FROM children WHERE id = ${d.childId}`) as unknown as {
      child_full_name: string;
    }[];
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    const [settings] = (await sql`SELECT * FROM lunch_settings WHERE id = 1`) as unknown as LunchSettingsRow[];
    const unitPrice = d.lunchSize === 'large' ? settings.large_price_idr : settings.normal_price_idr;
    if (!unitPrice || unitPrice <= 0 || !settings.payable_to || !settings.bank_name || !settings.account_number) {
      res.status(409).json({ error: 'Lunch ordering is not set up yet — please check with the school office.' });
      return;
    }

    const result = await createLunchOrder({
      childId: d.childId,
      customerId: customerId,
      billedToName: child.child_full_name,
      startDate: d.startDate,
      endDate: d.endDate,
      weekdays: d.weekdays,
      lunchSize: d.lunchSize,
      foodPreference: d.foodPreference ?? null,
      allergiesNotes: d.allergiesNotes ?? null,
      unitPrice,
      dueDays: settings.invoice_due_days,
    });

    if (result.lunchCount === 0) {
      res.status(400).json({ error: 'No lunch days fall within that date range — please widen the range or select more days.' });
      return;
    }

    const invoiceData: InvoiceData = {
      invoice_number: result.invoiceNumber,
      invoice_type: 'lunch',
      billed_to_name: child.child_full_name,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: result.dueDate,
      currency: settings.currency,
      subtotal_amount: result.totalAmount,
      sibling_discount_amount: 0,
      total_amount: result.totalAmount,
      notes: null,
    };
    const lineItems: InvoiceLineItemData[] = [
      {
        child_id: d.childId,
        description: `Lunches (${d.lunchSize === 'large' ? 'Large' : 'Normal'} size)`,
        quantity: result.lunchCount,
        unit_price: unitPrice,
        line_total: result.totalAmount,
      },
    ];
    const pdfSettings: SchoolSettingsData = {
      payable_to: settings.payable_to,
      bank_name: settings.bank_name,
      account_number: settings.account_number,
      account_name: settings.account_name,
      swift_code: settings.swift_code,
      bank_address: settings.bank_address,
      bank_code: settings.bank_code,
      branch_code: settings.branch_code,
      clearing_code: settings.clearing_code,
    };

    const pdfBuffer = await renderToBuffer(InvoiceDocument({ invoice: invoiceData, lineItems, settings: pdfSettings }));

    const emailSent = await sendInvoiceEmail({
      toEmail: email,
      billedToName: child.child_full_name,
      invoiceNumber: result.invoiceNumber,
      invoiceType: 'lunch',
      totalAmount: result.totalAmount,
      currency: settings.currency,
      dueDate: result.dueDate,
      pdfBuffer,
    });
    if (!emailSent) {
      console.error('[api/account/lunch-orders/create] confirmation email failed to send', { invoiceId: result.invoiceId });
    }

    res.status(200).json({
      ok: true,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      lunchCount: result.lunchCount,
      totalAmount: result.totalAmount,
    });
  } catch (err) {
    console.error('[api/account/lunch-orders/create] failed', err);
    res.status(500).json({ error: `Could not create lunch order: ${err instanceof Error ? err.message : String(err)}` });
  }
}
