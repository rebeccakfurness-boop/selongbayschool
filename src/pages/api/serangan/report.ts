import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { getSeranganSessionOptions, type SeranganSessionData } from '@/lib/auth';
import { getSeranganReportData } from '@/lib/serangan';
import { SeranganReportDocument } from '@/lib/pdf/SeranganReportDocument';

/** Lives under the Pages Router -- same @react-pdf/renderer + App Router bug as every other PDF
 * route in this app (see /api/invoices/[id]/pdf.ts). Gated by the Serangan session directly
 * (this route sits outside src/proxy.ts's App Router middleware reach in the sense that Pages
 * Router API routes still pass through it per the matcher, but the session is re-checked here
 * too since a Pages Router handler can't rely on next/headers). */
export const config = { maxDuration: 30 };

function monthBounds(monthParam: string): { start: string; end: string; label: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthParam);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end), label: start.toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' }) };
}

function quarterBounds(quarterParam: string): { start: string; end: string; label: string } | null {
  const match = /^(\d{4})-Q([1-4])$/.exec(quarterParam);
  if (!match) return null;
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end), label: `Q${quarter} ${year} (${start.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' })}–${end.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' })})` };
}

function yearBounds(yearParam: string): { start: string; end: string; label: string } | null {
  const match = /^(\d{4})$/.exec(yearParam);
  if (!match) return null;
  const year = Number(match[1]);
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end), label: String(year) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<SeranganSessionData>(req, res, await getSeranganSessionOptions());
  if (!session.seranganAdminId) {
    res.status(403).json({ error: 'Please log in to download reports.' });
    return;
  }
  // Reports surface exactly the donation/expenditure/budget figures a 'staff' account must never
  // see -- same admin-only gate as every other finance route. Sessions predating the role column
  // have none stored; treat those as admin, same fallback as getCurrentSeranganAdmin.
  if ((session.role ?? 'admin') !== 'admin') {
    res.status(403).json({ error: 'Not authorized to generate reports.' });
    return;
  }

  const type = req.query.type === 'quarter' ? 'quarter' : req.query.type === 'year' ? 'year' : req.query.type === 'month' ? 'month' : null;
  if (!type) {
    res.status(400).json({ error: 'type must be "month", "quarter", or "year".' });
    return;
  }

  let bounds: { start: string; end: string; label: string } | null = null;
  let filenamePart = '';
  if (type === 'month') {
    const monthParam = typeof req.query.month === 'string' ? req.query.month : '';
    bounds = monthBounds(monthParam);
    filenamePart = monthParam;
    if (!bounds) {
      res.status(400).json({ error: 'month must be YYYY-MM.' });
      return;
    }
  } else if (type === 'quarter') {
    const quarterParam = typeof req.query.quarter === 'string' ? req.query.quarter : '';
    bounds = quarterBounds(quarterParam);
    filenamePart = quarterParam;
    if (!bounds) {
      res.status(400).json({ error: 'quarter must be YYYY-Q1 (or Q2/Q3/Q4).' });
      return;
    }
  } else {
    const yearParam = typeof req.query.year === 'string' ? req.query.year : '';
    bounds = yearBounds(yearParam);
    filenamePart = yearParam;
    if (!bounds) {
      res.status(400).json({ error: 'year must be YYYY.' });
      return;
    }
  }

  try {
    await ensureSchema();
    const [admin] = (await sql`SELECT COALESCE(display_name, email) AS label FROM serangan_admin_users WHERE id = ${session.seranganAdminId}`) as unknown as {
      label: string;
    }[];
    const generatedByLabel = admin?.label ?? 'Serangan English School';

    const report = await getSeranganReportData(bounds.start, bounds.end, bounds.label);
    const buffer = await renderToBuffer(SeranganReportDocument({ report, generatedByLabel }));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="serangan-${type}-report-${filenamePart.replace(/[^a-z0-9-]+/gi, '-')}.pdf"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/serangan/report] failed to render', err);
    res.status(500).json({ error: `Could not generate report: ${err instanceof Error ? err.message : String(err)}` });
  }
}
