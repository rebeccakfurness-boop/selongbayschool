import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getCreditNoteById } from '@/lib/credit-notes';
import { CreditNoteDocument } from '@/lib/pdf/CreditNoteDocument';

/** Lives under the Pages Router -- @react-pdf/renderer throws inside an App Router route handler
 * (see /api/invoices/[id]/pdf.ts for the full explanation). Admin-only for now, unlike the
 * invoice PDF route which guardians/students can also reach -- credit notes are an internal
 * record of what admin decided to do, not something parents are given self-service access to. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid credit note id.' });
    return;
  }

  try {
    await ensureSchema();
    const creditNote = await getCreditNoteById(id);
    if (!creditNote) {
      res.status(404).json({ error: 'Credit note not found.' });
      return;
    }

    const buffer = await renderToBuffer(CreditNoteDocument({ creditNote }));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="credit-note-${creditNote.credit_note_number}.pdf"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/credit-notes/:id/pdf] failed to render', err);
    res.status(500).json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` });
  }
}
