import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { COMPLIANCE_FORM_CONTENT } from '@/lib/compliance-forms';
import { isComplianceFormKey, getComplianceSignature } from '@/lib/compliance-signatures';
import { ComplianceFormDocument } from '@/lib/pdf/ComplianceFormDocument';

/** Parent-facing counterpart to /api/admin/compliance/:childId/:formKey/pdf -- same rendered
 * document, gated by guardianOwnsChild instead of staff role. Lives under the Pages Router for the
 * same @react-pdf/renderer-inside-App-Router-route-handler reason documented on that route and on
 * /api/invoices/:id/pdf. Not covered by src/proxy.ts's matcher (only /api/admin/:path* is), so
 * authorization is checked directly here, same as the invoice/learning-profile PDF routes. */
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

  const session = await getIronSession<CustomerSessionData>(req, res, await getCustomerSessionOptions());
  if (!session.customerId || !(await guardianOwnsChild(session.customerId, childId))) {
    res.status(403).json({ error: 'Not authorized to view this document.' });
    return;
  }

  await ensureSchema();

  const children = await sql`SELECT child_full_name, class_name FROM children WHERE id = ${childId}`;
  const child = children[0];
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
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
    console.error('[api/account/compliance/:childId/:formKey/pdf] failed to render', err);
    res.status(500).json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` });
  }
}
