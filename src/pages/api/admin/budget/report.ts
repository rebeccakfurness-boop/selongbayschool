import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { ensureSchema, sql } from '@/lib/db';
import { getBudgetSettings, getBudgetReportData } from '@/lib/budget';
import { getSchoolReportData } from '@/lib/school-report';
import { BudgetReportDocument } from '@/lib/pdf/BudgetReportDocument';
import { SchoolReportDocument } from '@/lib/pdf/SchoolReportDocument';
import { ProfitAndLossDocument } from '@/lib/pdf/ProfitAndLossDocument';

/** Lives under the Pages Router -- @react-pdf/renderer throws inside an App Router route handler
 * (see /api/invoices/[id]/pdf.ts for the full explanation). Several sequential queries (settings,
 * balances, and per-report breakdowns) plus the PDF render can add up on a cold start, same
 * reasoning as the payslip generate route. */
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
  return {
    start: toIso(start),
    end: toIso(end),
    label: start.toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
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

/** Admin-only, and additionally requires the Budget Tracker's own unlock (matching
 * requireBudgetUnlocked -- that App Router helper can't be reused here since it reads cookies via
 * next/headers, which isn't available in a Pages Router API route). The school operations report
 * isn't really "budget" data, but it's gated the same way since it lives on the same Reports tab
 * and the school wants it restricted to the same Principal/admin audience as the financial ones. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (!session.adminUserId || session.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can download budget reports.' });
    return;
  }
  if (!session.budgetUnlocked) {
    res.status(403).json({ error: 'Unlock the Budget Tracker first.' });
    return;
  }

  const reportKind = req.query.report === 'operations' ? 'operations' : req.query.report === 'profit_loss' ? 'profit_loss' : 'financial';
  const requestedType = req.query.type === 'term' ? 'term' : req.query.type === 'year' ? 'year' : req.query.type === 'month' ? 'month' : null;
  // The P&L statement is only ever a month or a year (no school-term option, unlike the other two
  // reports) -- a term is a tuition-cycle concept, not an accounting period a board P&L reports on.
  if (!requestedType || (reportKind === 'profit_loss' && requestedType === 'term')) {
    res.status(400).json({ error: reportKind === 'profit_loss' ? 'type must be "month" or "year" for a P&L statement.' : 'type must be "month", "term", or "year".' });
    return;
  }
  const type = requestedType;

  try {
    await ensureSchema();

    let periodStart: string;
    let periodEnd: string;
    let periodLabel: string;
    let filenamePart: string;

    if (type === 'month') {
      const monthParam = typeof req.query.month === 'string' ? req.query.month : '';
      const bounds = monthBounds(monthParam);
      if (!bounds) {
        res.status(400).json({ error: 'month must be YYYY-MM.' });
        return;
      }
      periodStart = bounds.start;
      periodEnd = bounds.end;
      periodLabel = bounds.label;
      filenamePart = monthParam;
    } else if (type === 'year') {
      const yearParam = typeof req.query.year === 'string' ? req.query.year : '';
      const bounds = yearBounds(yearParam);
      if (!bounds) {
        res.status(400).json({ error: 'year must be YYYY.' });
        return;
      }
      periodStart = bounds.start;
      periodEnd = bounds.end;
      periodLabel = bounds.label;
      filenamePart = yearParam;
    } else {
      const settings = await getBudgetSettings();
      periodStart = settings.term_start_date;
      periodEnd = settings.term_end_date;
      periodLabel = settings.term_label;
      filenamePart = settings.term_label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const [admin] = (await sql`SELECT COALESCE(display_name, email) AS label FROM admin_users WHERE id = ${session.adminUserId}`) as unknown as {
      label: string;
    }[];
    const generatedByLabel = admin?.label ?? 'School Administration';

    let buffer: Buffer;
    if (reportKind === 'operations') {
      buffer = await renderToBuffer(SchoolReportDocument({ report: await getSchoolReportData(periodStart, periodEnd, periodLabel), generatedByLabel }));
    } else if (reportKind === 'profit_loss') {
      buffer = await renderToBuffer(ProfitAndLossDocument({ report: await getBudgetReportData(type, periodStart, periodEnd, periodLabel), generatedByLabel }));
    } else {
      buffer = await renderToBuffer(BudgetReportDocument({ report: await getBudgetReportData(type, periodStart, periodEnd, periodLabel), generatedByLabel }));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportKind}-${type}-report-${filenamePart}.pdf"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/admin/budget/report] failed to render', err);
    res.status(500).json({ error: `Could not generate report: ${err instanceof Error ? err.message : String(err)}` });
  }
}
