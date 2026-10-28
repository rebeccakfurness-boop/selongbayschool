import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { signStaffContractSchema, firstIssueMessage } from '@/lib/validation';
import { signContract, getContract } from '@/lib/staff-contracts';
import { getStaffDetail } from '@/lib/staff-hr';

/** Lives under the Pages Router -- same @react-pdf/renderer + App Router bug as
 * contracts/generate.ts right next to this one. The staff member signs their own contract (role
 * checked against the :id in the URL, not just "any logged-in staff member"); an admin may also
 * sign on a staff member's behalf (e.g. a paper signature collected in person and re-entered),
 * same allowance the compliance-form sign route gives an admin for a parent. */
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId) {
    res.status(403).json({ error: 'Not authorized.' });
    return;
  }

  const adminUserId = Number(req.query.id);
  const contractId = Number(req.query.contractId);
  if (!Number.isInteger(adminUserId) || !Number.isInteger(contractId)) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  const isAdmin = session.role === 'admin';
  const isOwner = String(session.adminUserId) === String(adminUserId);
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'Not authorized.' });
    return;
  }

  const parsed = signStaffContractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstIssueMessage(parsed.error, 'Invalid signature.') });
    return;
  }

  try {
    await ensureSchema();
    const contract = await getContract(contractId);
    if (!contract || String(contract.admin_user_id) !== String(adminUserId)) {
      res.status(404).json({ error: 'Contract not found.' });
      return;
    }
    if (contract.status === 'draft') {
      res.status(409).json({ error: 'This contract has not been sent yet.' });
      return;
    }
    if (contract.status !== 'sent') {
      res.status(409).json({ error: 'This contract has already been signed.' });
      return;
    }

    const staff = await getStaffDetail(adminUserId);
    if (!staff) {
      res.status(404).json({ error: 'Staff member not found.' });
      return;
    }

    await signContract(contractId, staff.display_name ?? staff.email, parsed.data.signedByName, parsed.data.signatureDataUrl);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts/:contractId/sign] failed', err);
    res.status(500).json({ error: `Could not save signature: ${err instanceof Error ? err.message : String(err)}` });
  }
}
