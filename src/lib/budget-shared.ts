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
