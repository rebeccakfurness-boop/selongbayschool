import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendWelcomeLetterEmail } from '@/lib/email';
import { sendWelcomeLetterSchema } from '@/lib/validation';
import { recordWelcomeLetterSent } from '@/lib/welcome-letters';
import { WelcomeLetterDocument } from '@/lib/pdf/WelcomeLetterDocument';

/** Lives under the Pages Router — see /api/invoices/[id]/pdf.ts for why. Admin-only "Send now"
 * override on the Child Card, for a child whose welcome letter shouldn't wait for the cron (or
 * needs re-sending) — create-or-resend in one action, same as the off-boarding letter's button,
 * since there's no per-family content to draft first. */
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

  const parsed = sendWelcomeLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request.' });
    return;
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const children = await sql`
      SELECT child_full_name, parent1_name, parent2_name, enrolment_date::text, class_name
      FROM children WHERE id = ${d.childId}
    `;
    const child = children[0] as
      | { child_full_name: string; parent1_name: string | null; parent2_name: string | null; enrolment_date: string | null; class_name: string | null }
      | undefined;
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }
    if (!child.enrolment_date) {
      res.status(400).json({ error: 'Set an enrolment date on the Child Card first.' });
      return;
    }

    const pdfBuffer = await renderToBuffer(
      WelcomeLetterDocument({
        letter: {
          child_full_name: child.child_full_name,
          parent1_name: child.parent1_name,
          parent2_name: child.parent2_name,
          enrolment_date: child.enrolment_date,
          class_name: child.class_name,
        },
      })
    );

    const sent = await sendWelcomeLetterEmail({
      toEmail: d.email,
      childFullName: child.child_full_name,
      pdfBuffer,
    });

    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }

    await recordWelcomeLetterSent(d.childId, 'admin');

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/welcome-letters/send] failed', err);
    res.status(500).json({ error: `Could not send welcome letter: ${err instanceof Error ? err.message : String(err)}` });
  }
}
