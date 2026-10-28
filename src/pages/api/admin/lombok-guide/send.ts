import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendLombokGuideSchema } from '@/lib/validation';
import { getActiveGuideEntries } from '@/lib/lombok-guide';
import { LombokGuideDocument } from '@/lib/pdf/LombokGuideDocument';
import { sendLombokGuideEmail } from '@/lib/email';

/** Lives under the Pages Router -- same @react-pdf/renderer + App Router bug as every other PDF
 * route in this app. Admin-only "Send Lombok Guide" action on the Child Card -- no per-family
 * content, so unlike the Welcome Letter this needs no child lookup at all, just the email address
 * and (optionally) the child's name for the email greeting. */
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

  const parsed = sendLombokGuideSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request.' });
    return;
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const entries = await getActiveGuideEntries();
    const pdfBuffer = await renderToBuffer(LombokGuideDocument({ entries }));

    const sent = await sendLombokGuideEmail({ toEmail: d.email, childFullName: d.childFullName || null, pdfBuffer });
    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/lombok-guide/send] failed', err);
    res.status(500).json({ error: `Could not send the Lombok Guide: ${err instanceof Error ? err.message : String(err)}` });
  }
}
