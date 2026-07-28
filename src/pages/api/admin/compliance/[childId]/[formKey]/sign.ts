import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { signComplianceFormSchema } from '@/lib/validation';
import { isComplianceFormKey, upsertComplianceSignature, deleteComplianceSignature } from '@/lib/compliance-signatures';

/** Lives under the Pages Router purely for consistency with its sibling pdf.ts/send.ts routes in
 * this same directory (this route itself doesn't touch @react-pdf/renderer, so it isn't actually
 * affected by the App Router bug those two work around — but splitting one route out per
 * directory across routers would be more confusing than helpful). Admin-only, matching every
 * other write action on the Child Card (canEdit gates this client-side too). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const childId = Number(req.query.childId);
  const formKey = String(req.query.formKey);
  if (!Number.isInteger(childId) || !isComplianceFormKey(formKey)) {
    res.status(400).json({ error: 'Invalid child or form.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  await ensureSchema();

  if (req.method === 'POST') {
    const parsed = signComplianceFormSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid signature.' });
      return;
    }
    try {
      const row = await upsertComplianceSignature(childId, formKey, parsed.data.signedByName, parsed.data.signatureDataUrl);
      res.status(200).json({ ok: true, signedAt: row.signed_at });
    } catch (err) {
      console.error('[api/admin/compliance/:childId/:formKey/sign] failed', err);
      res.status(500).json({ error: `Could not save signature: ${err instanceof Error ? err.message : String(err)}` });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await deleteComplianceSignature(childId, formKey);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[api/admin/compliance/:childId/:formKey/sign] failed to clear', err);
      res.status(500).json({ error: `Could not clear signature: ${err instanceof Error ? err.message : String(err)}` });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
