import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { canAccessClass } from '@/lib/current-staff';
import { getLetterOfOfferById } from '@/lib/letters-of-offer';
import { LetterOfOfferDocument } from '@/lib/pdf/LetterOfOfferDocument';

/** Lives under the Pages Router — see /api/invoices/[id]/pdf.ts for why. Not under /api/admin/, so
 * src/proxy.ts doesn't force a staff session here: a parent following the accept link in their
 * email (no portal login, just the token from that link) needs to be able to view the PDF too,
 * the same reasoning as the invoice PDF route allowing a guardian session through. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid letter of offer id.' });
    return;
  }

  await ensureSchema();
  const letter = await getLetterOfOfferById(id);
  if (!letter) {
    res.status(404).json({ error: 'Letter of offer not found.' });
    return;
  }

  const token = typeof req.query.token === 'string' ? req.query.token : null;
  let authorized = token !== null && token === letter.accept_token;

  if (!authorized) {
    const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
    if (session.adminUserId) {
      authorized =
        session.role === 'admin' ||
        (await canAccessClass({ adminUserId: session.adminUserId, email: session.email!, role: 'teacher' }, letter.class_name));
    }
  }

  if (!authorized) {
    res.status(403).json({ error: 'Not authorized to view this letter.' });
    return;
  }

  try {
    const buffer = await renderToBuffer(
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
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="letter-of-offer-${letter.child_full_name.replace(/[^a-z0-9]+/gi, '-')}.pdf"`
    );
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/letters-of-offer/:id/pdf] failed to render', err);
    res.status(500).json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` });
  }
}
