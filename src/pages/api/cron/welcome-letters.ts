import type { NextApiRequest, NextApiResponse } from 'next';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema } from '@/lib/db';
import { sendWelcomeLetterEmail } from '@/lib/email';
import { getChildrenDueForWelcomeLetter, recordWelcomeLetterSent, WELCOME_LETTER_DAYS_BEFORE } from '@/lib/welcome-letters';
import { WelcomeLetterDocument } from '@/lib/pdf/WelcomeLetterDocument';

/** Lives under the Pages Router — see /api/invoices/[id]/pdf.ts for why (react-pdf's reconciler
 * doesn't render from an App Router route handler). Daily, same CRON_SECRET auth as
 * /api/cron/passes (see vercel.json); a child only ever gets one welcome letter, since
 * getChildrenDueForWelcomeLetter excludes anyone with a welcome_letters row already. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    await ensureSchema();

    const dueChildren = await getChildrenDueForWelcomeLetter(WELCOME_LETTER_DAYS_BEFORE);

    let sentCount = 0;
    for (const child of dueChildren) {
      try {
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
          toEmail: child.primary_contact_email,
          childFullName: child.child_full_name,
          pdfBuffer,
        });

        if (sent) {
          await recordWelcomeLetterSent(child.id, 'auto');
          sentCount++;
        }
      } catch (err) {
        console.error('[api/cron/welcome-letters] failed for child', { childId: child.id, err });
      }
    }

    res.status(200).json({ ok: true, dueCount: dueChildren.length, sentCount });
  } catch (err) {
    console.error('[api/cron/welcome-letters] failed', err);
    res.status(500).json({ error: 'Cron job failed.' });
  }
}
