import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendLetterOfOfferEmail } from '@/lib/email';
import { sendLetterOfOfferSchema } from '@/lib/validation';
import { getLetterOfOfferById } from '@/lib/letters-of-offer';
import { LetterOfOfferDocument } from '@/lib/pdf/LetterOfOfferDocument';
import { siteConfig } from '@/lib/site-content';

/** Lives under the Pages Router — see /api/invoices/[id]/pdf.ts for why. Admin-only, matching
 * every other write/send action on the Child Card. Marks status 'sent' only if it's still a
 * draft — re-sending an already-accepted letter (e.g. the parent lost their copy) shouldn't
 * regress its status. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid letter of offer id.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  const parsed = sendLetterOfOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
    return;
  }

  try {
    await ensureSchema();

    const letter = await getLetterOfOfferById(id);
    if (!letter) {
      res.status(404).json({ error: 'Letter of offer not found.' });
      return;
    }

    const pdfBuffer = await renderToBuffer(
      LetterOfOfferDocument({
        letter: {
          id: letter.id,
          status: letter.status,
          start_date: letter.start_date,
          programme: letter.programme,
          class_name: letter.class_name,
          tuition_plan: letter.tuition_plan,
          fees_note: letter.fees_note,
          additional_terms: letter.additional_terms,
          accepted_at: letter.accepted_at,
          accepted_by_name: letter.accepted_by_name,
          child_full_name: letter.child_full_name,
          parent1_name: letter.parent1_name,
          parent2_name: letter.parent2_name,
          created_at: letter.created_at,
        },
      })
    );

    const acceptUrl = new URL(`/letter-of-offer/${letter.accept_token}`, siteConfig.url).toString();

    const sent = await sendLetterOfOfferEmail({
      toEmail: parsed.data.email,
      childFullName: letter.child_full_name,
      acceptUrl,
      pdfBuffer,
    });

    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }

    await sql`
      UPDATE letters_of_offer SET
        status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END,
        sent_at = now()
      WHERE id = ${id}
    `;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/letters-of-offer/:id/send] failed', err);
    res.status(500).json({ error: `Could not send letter of offer: ${err instanceof Error ? err.message : String(err)}` });
  }
}
