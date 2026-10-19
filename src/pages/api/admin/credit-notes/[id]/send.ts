import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { sendCreditNoteEmail } from '@/lib/email';
import { getCreditNoteById } from '@/lib/credit-notes';
import { CreditNoteDocument } from '@/lib/pdf/CreditNoteDocument';

/** Lives under the Pages Router -- see /api/invoices/:id/pdf.ts for why (App Router route
 * handlers trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler;
 * Pages Router API routes don't). Same auth/body-schema pattern as
 * /api/admin/invoices/:id/send.ts. */
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
    res.status(400).json({ error: 'Invalid credit note id.' });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
    return;
  }

  try {
    await ensureSchema();
    const creditNote = await getCreditNoteById(id);
    if (!creditNote) {
      res.status(404).json({ error: 'Credit note not found.' });
      return;
    }

    const pdfBuffer = await renderToBuffer(CreditNoteDocument({ creditNote }));

    const sent = await sendCreditNoteEmail({
      toEmail: parsed.data.email,
      childFullName: creditNote.child_full_name,
      creditNoteNumber: creditNote.credit_note_number,
      kind: creditNote.kind,
      amountIdr: creditNote.amount_idr,
      reason: creditNote.reason,
      pdfBuffer,
    });

    if (!sent) {
      res.status(502).json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/admin/credit-notes/:id/send] failed', err);
    res.status(500).json({ error: `Could not send credit note: ${err instanceof Error ? err.message : String(err)}` });
  }
}
