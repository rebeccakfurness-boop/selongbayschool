import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendComplianceFormEmail } from '@/lib/email';
import { sendComplianceFormSchema } from '@/lib/validation';
import { COMPLIANCE_FORM_CONTENT } from '@/lib/compliance-forms';
import { isComplianceFormKey, getComplianceSignature } from '@/lib/compliance-signatures';
import { ComplianceFormDocument } from '@/lib/pdf/ComplianceFormDocument';

/** Lives under the Pages Router — see /api/invoices/[id]/pdf.ts for why. Admin-only, matching
 * every other write/send action on the Child Card. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  const parsed = sendComplianceFormSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
    return;
  }

  try {
    await ensureSchema();

    const children = await sql`SELECT child_full_name, class_name FROM children WHERE id = ${childId}`;
    const child = children[0];
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    const signatureRow = await getComplianceSignature(childId, formKey);
    const content = COMPLIANCE_FORM_CONTENT[formKey];

    const pdfBuffer = await renderToBuffer(
      ComplianceFormDocument({
        childFullName: child.child_full_name as string,
        className: child.class_name as string | null,
        content,
        signature: signatureRow
          ? { signedByName: signatureRow.signed_by_name, signatureDataUrl: signatureRow.signature_data_url, signedAt: signatureRow.signed_at }
          : null,
      })
    );

    const sent = await sendComplianceFormEmail({
      toEmail: parsed.data.email,
      childFullName: child.child_full_name as string,
      formTitle: content.title,
      alreadySigned: Boolean(signatureRow),
      pdfBuffer,
    });

    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/compliance/:childId/:formKey/send] failed', err);
    res.status(500).json({ error: `Could not send form: ${err instanceof Error ? err.message : String(err)}` });
  }
}
