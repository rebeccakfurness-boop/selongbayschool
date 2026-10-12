import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { ensureSchema, sql } from '@/lib/db';
import { getCcaSettings, getCcaSummaryReportData } from '@/lib/cca';
import { CcaSummaryDocument } from '@/lib/pdf/CcaSummaryDocument';

/** Lives under the Pages Router -- @react-pdf/renderer throws inside an App Router route handler
 * (see /api/invoices/[id]/pdf.ts for the full explanation). */
export const config = { maxDuration: 30 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can download the CCA summary.' });
    return;
  }

  try {
    await ensureSchema();

    const settings = await getCcaSettings();
    if (!settings.term_label) {
      res.status(400).json({ error: 'No CCA term is set up yet.' });
      return;
    }

    const [admin] = (await sql`SELECT COALESCE(display_name, email) AS label FROM admin_users WHERE id = ${session.adminUserId}`) as unknown as {
      label: string;
    }[];
    const generatedByLabel = admin?.label ?? 'School Administration';

    const report = await getCcaSummaryReportData(settings.term_label);
    const buffer = await renderToBuffer(CcaSummaryDocument({ report, generatedByLabel }));

    const filenamePart = settings.term_label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cca-summary-${filenamePart}.pdf"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/admin/cca/report] failed to render', err);
    res.status(500).json({ error: `Could not generate report: ${err instanceof Error ? err.message : String(err)}` });
  }
}
