import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendLearningProfileEmail } from '@/lib/email';
import { LearningProfileDocument, type LearningProfileData, type LearningProfileSubjectData } from '@/lib/pdf/LearningProfileDocument';

/** Lives under the Pages Router — see /api/invoices/:id/pdf.ts for why (App Router route handlers
 * trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler; Pages
 * Router API routes don't).
 *
 * Admin-only, and blocked unless the report is already approved — sending is the last step of
 * "approve, then send, then it's visible in the Parent Portal", not a way to skip approval. */
const bodySchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') });

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

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid report id.' });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
    return;
  }

  try {
    await ensureSchema();
    const profiles = (await sql`SELECT * FROM learning_profiles WHERE id = ${id}`) as unknown as (LearningProfileData & {
      child_id: number;
      status: string;
    })[];
    const profile = profiles[0];
    if (!profile) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    if (profile.status !== 'approved') {
      res.status(400).json({ error: 'Approve the report before sending it to a parent.' });
      return;
    }

    const children = await sql`SELECT child_full_name FROM children WHERE id = ${profile.child_id}`;
    const child = children[0];
    if (!child) {
      res.status(404).json({ error: 'Child not found.' });
      return;
    }

    const subjects = (await sql`
      SELECT subject_area, sub_subject, achievement, effort, teacher_comment
      FROM learning_profile_subjects WHERE learning_profile_id = ${id} ORDER BY sort_order
    `) as unknown as LearningProfileSubjectData[];

    const pdfBuffer = await renderToBuffer(
      LearningProfileDocument({ childFullName: child.child_full_name as string, profile, subjects })
    );

    const sent = await sendLearningProfileEmail({
      toEmail: parsed.data.email,
      childFullName: child.child_full_name as string,
      termLabel: profile.term_label,
      pdfBuffer,
    });

    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }

    await sql`UPDATE learning_profiles SET sent_at = now() WHERE id = ${id}`;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/learning-profiles/:id/send] failed', err);
    res.status(500).json({ error: `Could not send report: ${err instanceof Error ? err.message : String(err)}` });
  }
}
