import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema } from '@/lib/db';
import { getSessionOptions, getCustomerSessionOptions, type AdminSessionData, type CustomerSessionData } from '@/lib/auth';
import { getActiveGuideEntries } from '@/lib/lombok-guide';
import { LombokGuideDocument } from '@/lib/pdf/LombokGuideDocument';

/** Lives under the Pages Router -- see /api/invoices/[id]/pdf.ts for why (App Router route
 * handlers trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler;
 * Pages Router API routes don't). Reachable by any logged-in staff member or parent (the "Download
 * PDF" link on both the admin and parent-facing Lombok Guide pages) -- content isn't
 * family-specific or sensitive, just gated to the school portal rather than left fully public. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const adminSession = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  const customerSession = await getIronSession<CustomerSessionData>(req, res, await getCustomerSessionOptions());
  if (!adminSession.adminUserId && !customerSession.customerId) {
    res.status(403).json({ error: 'Please log in to view the Lombok Guide.' });
    return;
  }

  try {
    await ensureSchema();
    const entries = await getActiveGuideEntries();
    const pdfBuffer = await renderToBuffer(LombokGuideDocument({ entries }));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="lombok-guide.pdf"');
    res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('[api/lombok-guide/pdf] failed to render', err);
    res.status(500).json({ error: `Could not generate the guide: ${err instanceof Error ? err.message : String(err)}` });
  }
}
