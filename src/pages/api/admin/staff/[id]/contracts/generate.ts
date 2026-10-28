import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { generateStaffContractSchema, firstIssueMessage } from '@/lib/validation';
import { generateContract } from '@/lib/staff-contracts';
import { getStaffDetail } from '@/lib/staff-hr';
import { sendStaffContractReadyEmail } from '@/lib/email';

/** Lives under the Pages Router -- see /api/invoices/[id]/pdf.ts (and staff/[id]/payslips/generate.ts
 * right next to this one) for why: App Router route handlers trigger a "Minified React error #31"
 * inside @react-pdf/renderer's bundled reconciler; Pages Router API routes don't. Admin-only,
 * matching every other write action on the Staff Card. */
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can create staff contracts.' });
    return;
  }

  const adminUserId = Number(req.query.id);
  if (!Number.isInteger(adminUserId)) {
    res.status(400).json({ error: 'Invalid staff id.' });
    return;
  }

  const parsed = generateStaffContractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstIssueMessage(parsed.error, 'Invalid contract.') });
    return;
  }

  try {
    await ensureSchema();
    const staff = await getStaffDetail(adminUserId);
    if (!staff) {
      res.status(404).json({ error: 'Staff member not found.' });
      return;
    }
    const employeeName = staff.display_name ?? staff.email;
    const id = await generateContract(adminUserId, employeeName, parsed.data, session.adminUserId);

    if (parsed.data.send) {
      await sendStaffContractReadyEmail({ toEmail: staff.email, staffName: employeeName, title: parsed.data.title, adminUserId });
    }

    res.status(200).json({ id });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts/generate] failed', err);
    res.status(500).json({ error: `Could not generate that contract: ${err instanceof Error ? err.message : String(err)}` });
  }
}
