import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { canAccessClass } from '@/lib/current-staff';
import { COMPLIANCE_FORM_CONTENT } from '@/lib/compliance-forms';
import { isComplianceFormKey, getComplianceSignature } from '@/lib/compliance-signatures';
import { ComplianceFormDocument } from '@/lib/pdf/ComplianceFormDocument';

/** Lives under the Pages Router — see /api/invoices/[id]/pdf.ts for why (App Router route
 * handlers trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler;
 * Pages Router API routes don't).
 *
 * src/proxy.ts's matcher covers /api/admin/:path* regardless of app/pages router, so it already
 * guarantees a logged-in staff member here. Teachers are further scoped to their own assigned
 * classes (same as the learning-profile PDF), since these are personal consent/compliance
 * documents, not something every teacher should be able to pull up for every child. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const childId = Number(req.query.childId);
  const formKey = String(req.query.formKey);
  if (!Number.isInteger(childId) || !isComplianceFormKey(formKey)) {
    res.status(400).json({ error: 'Invalid child or form.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  await ensureSchema();

  const children = await sql`SELECT child_full_name, class_name FROM children WHERE id = ${childId}`;
  const child = children[0];
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  if (session.role !== 'admin') {
    const allowed = await canAccessClass(
      { adminUserId: session.adminUserId, email: session.email!, role: 'teacher' },
      child.class_name as string | null
    );
    if (!allowed) {
      res.status(403).json({ error: 'Not authorized to view this document.' });
      return;
    }
  }

  const signatureRow = await getComplianceSignature(childId, formKey);

  try {
    const buffer = await renderToBuffer(
      ComplianceFormDocument({
        childFullName: child.child_full_name as string,
        className: child.class_name as string | null,
        content: COMPLIANCE_FORM_CONTENT[formKey],
        signature: signatureRow
          ? { signedByName: signatureRow.signed_by_name, signatureDataUrl: signatureRow.signature_data_url, signedAt: signatureRow.signed_at }
          : null,
      })
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${COMPLIANCE_FORM_CONTENT[formKey].title.replace(/[^a-z0-9]+/gi, '-')}-${(child.child_full_name as string).replace(/[^a-z0-9]+/gi, '-')}.pdf"`
    );
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/admin/compliance/:childId/:formKey/pdf] failed to render', err);
    res.status(500).json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` });
  }
}
