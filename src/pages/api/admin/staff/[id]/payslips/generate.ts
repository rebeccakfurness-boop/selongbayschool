import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { generatePayslipSchema, firstIssueMessage } from '@/lib/validation';
import { generatePayslip } from '@/lib/staff-hr';

/** Lives under the Pages Router -- see /api/invoices/[id]/pdf.ts for why (App Router route
 * handlers trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler;
 * Pages Router API routes don't). Admin-only, matching every other write action on the Staff
 * Card. Listing payslips and the DOB-gated download stay on the App Router GET/download routes
 * next to this one -- neither of those touches @react-pdf/renderer. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can generate payslips.' });
    return;
  }

  const adminUserId = Number(req.query.id);
  if (!Number.isInteger(adminUserId)) {
    res.status(400).json({ error: 'Invalid staff id.' });
    return;
  }

  const parsed = generatePayslipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstIssueMessage(parsed.error, 'Invalid payslip.') });
    return;
  }

  try {
    await ensureSchema();
    const id = await generatePayslip(adminUserId, parsed.data, session.adminUserId);
    res.status(200).json({ id });
  } catch (err) {
    console.error('[api/admin/staff/:id/payslips/generate] failed', err);
    res.status(500).json({ error: `Could not generate that payslip: ${err instanceof Error ? err.message : String(err)}` });
  }
}
