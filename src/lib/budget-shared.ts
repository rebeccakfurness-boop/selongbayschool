/** Pure helpers with no DB access, split out from budget.ts specifically so client components
 * (BudgetSetupManager, LogRevenueForm, etc.) can import them without pulling
 * '@neondatabase/serverless' into the browser bundle — same reasoning as
 * child-lifecycle-shared.ts. budget.ts re-exports everything here too, so server code can import
 * from either file. */

export type BudgetStatus = 'healthy' | 'warning' | 'over';

/** "Rp 12,700,000" — deliberately not the site-wide formatIDR() in site-content.ts, which renders
 * "Rp12.700.000" (id-ID locale grouping) — the school specifically asked for comma grouping with
 * a space after "Rp" for this tool. */
export function formatBudgetIDR(amount: number): string {
  return `Rp ${new Intl.NumberFormat('en-US').format(Math.round(amount))}`;
}

/** >80% spent is amber, over 100% is red — matches the school's own brief. */
export function budgetStatus(budgetIdr: number, spentIdr: number): BudgetStatus {
  if (budgetIdr <= 0) return spentIdr > 0 ? 'over' : 'healthy';
  const pct = spentIdr / budgetIdr;
  if (pct > 1) return 'over';
  if (pct > 0.8) return 'warning';
  return 'healthy';
}

export interface QuarterBounds {
  label: string;
  startDate: string;
  endDate: string;
}

/** Standard calendar quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec) — deliberately NOT the same as
 * budget_settings.term_start_date/term_end_date, which are the school's own ~4-5 month terms and
 * don't align to calendar quarters. Used only by the Budget Forecast page. Computed in UTC so the
 * date math never shifts a day across a timezone boundary. */
export function quarterBoundsForDate(date: Date): QuarterBounds {
  const year = date.getUTCFullYear();
  const q = Math.floor(date.getUTCMonth() / 3);
  const startMonth = q * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { label: `Q${q + 1} ${year}`, startDate: toIso(start), endDate: toIso(end) };
}

export function nextQuarterBoundsForDate(date: Date): QuarterBounds {
  const year = date.getUTCFullYear();
  const q = Math.floor(date.getUTCMonth() / 3);
  return quarterBoundsForDate(new Date(Date.UTC(year, q * 3 + 3, 1)));
}
