import { sql } from '@/lib/db';
import type {
  LogRevenueInput,
  LogExpenseInput,
  UpdateBudgetSettingsInput,
  CreateBudgetImportBatchInput,
  UpsertBudgetForecastEntryInput,
} from '@/lib/validation';
import { budgetStatus, type BudgetStatus } from '@/lib/budget-shared';

export * from '@/lib/budget-shared';

export interface BudgetCategoryRow {
  id: number;
  name: string;
  monthly_budget_idr: number;
  is_archived: boolean;
  sort_order: number;
}

export async function getBudgetCategories(includeArchived = false): Promise<BudgetCategoryRow[]> {
  return (
    includeArchived
      ? await sql`SELECT id, name, monthly_budget_idr, is_archived, sort_order FROM budget_categories ORDER BY sort_order, name`
      : await sql`SELECT id, name, monthly_budget_idr, is_archived, sort_order FROM budget_categories WHERE is_archived = false ORDER BY sort_order, name`
  ) as unknown as BudgetCategoryRow[];
}

export interface BudgetSettingsRow {
  term_label: string;
  term_start_date: string;
  term_end_date: string;
  opening_cash_idr: number;
  opening_cash_as_of: string;
}

export async function getBudgetSettings(): Promise<BudgetSettingsRow> {
  const rows = (await sql`
    SELECT term_label, term_start_date::text, term_end_date::text, opening_cash_idr, opening_cash_as_of::text
    FROM budget_settings WHERE id = 1
  `) as unknown as BudgetSettingsRow[];
  return rows[0];
}

export async function updateBudgetSettings(input: UpdateBudgetSettingsInput): Promise<void> {
  await sql`
    UPDATE budget_settings SET
      term_label = ${input.termLabel},
      term_start_date = ${input.termStartDate}::date,
      term_end_date = ${input.termEndDate}::date,
      opening_cash_idr = ${input.openingCashIdr},
      opening_cash_as_of = ${input.openingCashAsOf}::date
    WHERE id = 1
  `;
}

export interface CategorySummary extends BudgetCategoryRow {
  spent_month_idr: number;
  remaining_month_idr: number;
  status: BudgetStatus;
}

export interface DashboardTotals {
  revenue_idr: number;
  expenses_idr: number;
  net_idr: number;
}

export interface DashboardData {
  categories: CategorySummary[];
  month: DashboardTotals & { label: string };
  term: DashboardTotals & { label: string };
  cashOnHandIdr: number;
}

/** Everything the dashboard needs in one place. "Current month" = calendar month to date.
 * "Current term" = the editable term_start_date/term_end_date window from Budget Setup, not a
 * guessed date range. "Cash on hand" = the settings' opening balance (a real, dated bank figure)
 * plus every revenue/expense ever logged in the tracker since — see updateBudgetSettings for how
 * opening_cash_as_of is meant to be kept in sync if it's ever reset. */
export async function getDashboardData(): Promise<DashboardData> {
  const settings = await getBudgetSettings();
  const categories = await getBudgetCategories(false);

  const monthSpendRows = (await sql`
    SELECT category_id, COALESCE(SUM(amount_idr), 0)::bigint AS spent
    FROM budget_expenses
    WHERE entry_date >= date_trunc('month', CURRENT_DATE)::date
    GROUP BY category_id
  `) as unknown as { category_id: number; spent: number }[];
  const spendByCategory = new Map(monthSpendRows.map((r) => [r.category_id, Number(r.spent)]));

  const categorySummaries: CategorySummary[] = categories.map((c) => {
    const spent = spendByCategory.get(c.id) ?? 0;
    return {
      ...c,
      spent_month_idr: spent,
      remaining_month_idr: c.monthly_budget_idr - spent,
      status: budgetStatus(c.monthly_budget_idr, spent),
    };
  });

  const [monthTotals] = (await sql`
    SELECT
      COALESCE((SELECT SUM(amount_idr) FROM budget_revenue WHERE entry_date >= date_trunc('month', CURRENT_DATE)::date), 0)::bigint AS revenue,
      COALESCE((SELECT SUM(amount_idr) FROM budget_expenses WHERE entry_date >= date_trunc('month', CURRENT_DATE)::date), 0)::bigint AS expenses
  `) as unknown as { revenue: number; expenses: number }[];

  const [termTotals] = (await sql`
    SELECT
      COALESCE((SELECT SUM(amount_idr) FROM budget_revenue WHERE entry_date BETWEEN ${settings.term_start_date}::date AND ${settings.term_end_date}::date), 0)::bigint AS revenue,
      COALESCE((SELECT SUM(amount_idr) FROM budget_expenses WHERE entry_date BETWEEN ${settings.term_start_date}::date AND ${settings.term_end_date}::date), 0)::bigint AS expenses
  `) as unknown as { revenue: number; expenses: number }[];

  const [allTimeTotals] = (await sql`
    SELECT
      COALESCE((SELECT SUM(amount_idr) FROM budget_revenue), 0)::bigint AS revenue,
      COALESCE((SELECT SUM(amount_idr) FROM budget_expenses), 0)::bigint AS expenses
  `) as unknown as { revenue: number; expenses: number }[];

  const cashOnHandIdr = settings.opening_cash_idr + Number(allTimeTotals.revenue) - Number(allTimeTotals.expenses);

  return {
    categories: categorySummaries,
    month: {
      label: new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' }),
      revenue_idr: Number(monthTotals.revenue),
      expenses_idr: Number(monthTotals.expenses),
      net_idr: Number(monthTotals.revenue) - Number(monthTotals.expenses),
    },
    term: {
      label: settings.term_label,
      revenue_idr: Number(termTotals.revenue),
      expenses_idr: Number(termTotals.expenses),
      net_idr: Number(termTotals.revenue) - Number(termTotals.expenses),
    },
    cashOnHandIdr,
  };
}

export interface RevenueRow {
  id: number;
  entry_date: string;
  amount_idr: number;
  payer_source: string;
  description: string | null;
  payment_method: 'bank_transfer' | 'cash';
  receipt_url: string | null;
  created_by_label: string | null;
  created_at: string;
}

export async function getRevenueEntries(filters: { from?: string; to?: string; paymentMethod?: string } = {}): Promise<RevenueRow[]> {
  return (await sql`
    SELECT r.id, r.entry_date::text, r.amount_idr, r.payer_source, r.description, r.payment_method, r.receipt_url,
      COALESCE(au.display_name, au.email) AS created_by_label, r.created_at::text
    FROM budget_revenue r
    LEFT JOIN admin_users au ON au.id = r.created_by
    WHERE (${filters.from ?? null}::date IS NULL OR r.entry_date >= ${filters.from ?? null}::date)
      AND (${filters.to ?? null}::date IS NULL OR r.entry_date <= ${filters.to ?? null}::date)
      AND (${filters.paymentMethod ?? null}::text IS NULL OR r.payment_method = ${filters.paymentMethod ?? null}::text)
    ORDER BY r.entry_date DESC, r.id DESC
  `) as unknown as RevenueRow[];
}

export async function createRevenueEntry(input: LogRevenueInput, createdBy: number): Promise<number> {
  const rows = await sql`
    INSERT INTO budget_revenue (entry_date, amount_idr, payer_source, description, payment_method, receipt_url, created_by)
    VALUES (${input.entryDate}::date, ${input.amountIdr}, ${input.payerSource}, ${input.description || null}, ${input.paymentMethod}, ${input.receiptUrl || null}, ${createdBy})
    RETURNING id
  `;
  return rows[0].id as number;
}

export interface ExpenseRow {
  id: number;
  entry_date: string;
  amount_idr: number;
  category_id: number;
  category_name: string;
  vendor_description: string;
  authorized_by: string;
  receipt_url: string | null;
  created_by_label: string | null;
  created_at: string;
}

export async function getExpenseEntries(filters: { from?: string; to?: string; categoryId?: number } = {}): Promise<ExpenseRow[]> {
  return (await sql`
    SELECT e.id, e.entry_date::text, e.amount_idr, e.category_id, bc.name AS category_name, e.vendor_description,
      e.authorized_by, e.receipt_url, COALESCE(au.display_name, au.email) AS created_by_label, e.created_at::text
    FROM budget_expenses e
    JOIN budget_categories bc ON bc.id = e.category_id
    LEFT JOIN admin_users au ON au.id = e.created_by
    WHERE (${filters.from ?? null}::date IS NULL OR e.entry_date >= ${filters.from ?? null}::date)
      AND (${filters.to ?? null}::date IS NULL OR e.entry_date <= ${filters.to ?? null}::date)
      AND (${filters.categoryId ?? null}::bigint IS NULL OR e.category_id = ${filters.categoryId ?? null}::bigint)
    ORDER BY e.entry_date DESC, e.id DESC
  `) as unknown as ExpenseRow[];
}

export async function createExpenseEntry(input: LogExpenseInput, createdBy: number): Promise<number> {
  const rows = await sql`
    INSERT INTO budget_expenses (entry_date, amount_idr, category_id, vendor_description, authorized_by, receipt_url, created_by)
    VALUES (${input.entryDate}::date, ${input.amountIdr}, ${input.categoryId}, ${input.vendorDescription}, ${input.authorizedBy}, ${input.receiptUrl || null}, ${createdBy})
    RETURNING id
  `;
  return rows[0].id as number;
}

export interface CategoryHistoryRow {
  id: number;
  old_value_idr: number;
  new_value_idr: number;
  changed_by_label: string | null;
  changed_at: string;
}

export async function getCategoryHistory(categoryId: number): Promise<CategoryHistoryRow[]> {
  return (await sql`
    SELECT h.id, h.old_value_idr, h.new_value_idr, COALESCE(au.display_name, au.email) AS changed_by_label, h.changed_at::text
    FROM budget_category_history h
    LEFT JOIN admin_users au ON au.id = h.changed_by
    WHERE h.category_id = ${categoryId}
    ORDER BY h.changed_at DESC
  `) as unknown as CategoryHistoryRow[];
}

/** Deliberate override, not a silent edit — logs old/new/who/when to budget_category_history
 * before applying, so a changed figure always has a visible reason attached. */
export async function updateCategoryBudget(categoryId: number, newValueIdr: number, changedBy: number): Promise<void> {
  const rows = await sql`SELECT monthly_budget_idr FROM budget_categories WHERE id = ${categoryId}`;
  if (rows.length === 0) throw new Error('Category not found.');
  const oldValue = rows[0].monthly_budget_idr as number;

  await sql`
    INSERT INTO budget_category_history (category_id, changed_by, old_value_idr, new_value_idr)
    VALUES (${categoryId}, ${changedBy}, ${oldValue}, ${newValueIdr})
  `;
  await sql`UPDATE budget_categories SET monthly_budget_idr = ${newValueIdr} WHERE id = ${categoryId}`;
}

export async function createBudgetCategory(name: string, monthlyBudgetIdr: number): Promise<number> {
  const [{ next }] = (await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM budget_categories`) as unknown as { next: number }[];
  const rows = await sql`
    INSERT INTO budget_categories (name, monthly_budget_idr, sort_order)
    VALUES (${name}, ${monthlyBudgetIdr}, ${next})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function setBudgetCategoryArchived(categoryId: number, archived: boolean): Promise<void> {
  await sql`UPDATE budget_categories SET is_archived = ${archived} WHERE id = ${categoryId}`;
}

export type CombinedTransaction =
  | ({ kind: 'revenue' } & RevenueRow)
  | ({ kind: 'expense' } & ExpenseRow);

/** Combined, newest-first feed for the Transaction Log screen — revenue and expenses share no
 * table, so this merges two already-sorted queries rather than a SQL UNION across differently
 * shaped rows (category info only applies to expenses, payment method only to revenue). */
export async function getCombinedTransactions(filters: { from?: string; to?: string } = {}): Promise<CombinedTransaction[]> {
  const [revenue, expenses] = await Promise.all([
    getRevenueEntries({ from: filters.from, to: filters.to }),
    getExpenseEntries({ from: filters.from, to: filters.to }),
  ]);
  const combined: CombinedTransaction[] = [
    ...revenue.map((r) => ({ kind: 'revenue' as const, ...r })),
    ...expenses.map((e) => ({ kind: 'expense' as const, ...e })),
  ];
  combined.sort((a, b) => (a.entry_date < b.entry_date ? 1 : a.entry_date > b.entry_date ? -1 : b.id - a.id));
  return combined;
}

export interface BudgetImportBatchRow {
  id: number;
  source_label: string;
  period_start: string | null;
  period_end: string | null;
  opening_balance_idr: number | null;
  closing_balance_idr: number | null;
  revenue_count: number;
  expense_count: number;
  imported_by_label: string | null;
  imported_at: string;
}

export async function getBudgetImportBatches(): Promise<BudgetImportBatchRow[]> {
  return (await sql`
    SELECT b.id, b.source_label, b.period_start::text, b.period_end::text,
      b.opening_balance_idr, b.closing_balance_idr,
      (SELECT COUNT(*)::int FROM budget_revenue r WHERE r.import_batch_id = b.id) AS revenue_count,
      (SELECT COUNT(*)::int FROM budget_expenses e WHERE e.import_batch_id = b.id) AS expense_count,
      COALESCE(au.display_name, au.email) AS imported_by_label, b.imported_at::text
    FROM budget_import_batches b
    LEFT JOIN admin_users au ON au.id = b.imported_by
    ORDER BY b.imported_at DESC
  `) as unknown as BudgetImportBatchRow[];
}

/** Bulk-loads a reviewed batch of already-categorized revenue/expense rows (e.g. from a
 * reconciled bank statement) in one action, tagging every row with the new batch so it stays
 * traceable back to its source — see getBudgetImportBatches. Every row is inserted with
 * payment_method='bank_transfer' (the only method a bank/Wise statement import produces; a cash
 * entry still goes through the ordinary Log Revenue form). Loops rather than a multi-row INSERT
 * since batches are small (admin-reviewed, capped at 500 rows each in validation) and this mirrors
 * createRevenueEntry/createExpenseEntry's own per-row shape exactly. */
export async function createBudgetImportBatch(
  input: CreateBudgetImportBatchInput,
  createdBy: number
): Promise<{ batchId: number; revenueCount: number; expenseCount: number }> {
  const batches = await sql`
    INSERT INTO budget_import_batches (source_label, period_start, period_end, opening_balance_idr, closing_balance_idr, imported_by)
    VALUES (
      ${input.sourceLabel}, ${input.periodStart ?? null}::date, ${input.periodEnd ?? null}::date,
      ${input.openingBalanceIdr ?? null}, ${input.closingBalanceIdr ?? null}, ${createdBy}
    )
    RETURNING id
  `;
  const batchId = batches[0].id as number;

  for (const r of input.revenue) {
    await sql`
      INSERT INTO budget_revenue (entry_date, amount_idr, payer_source, description, payment_method, created_by, import_batch_id)
      VALUES (${r.entryDate}::date, ${r.amountIdr}, ${r.payerSource}, ${r.description || null}, 'bank_transfer', ${createdBy}, ${batchId})
    `;
  }
  for (const e of input.expenses) {
    await sql`
      INSERT INTO budget_expenses (entry_date, amount_idr, category_id, vendor_description, authorized_by, created_by, import_batch_id)
      VALUES (${e.entryDate}::date, ${e.amountIdr}, ${e.categoryId}, ${e.vendorDescription}, ${e.authorizedBy}, ${createdBy}, ${batchId})
    `;
  }

  return { batchId, revenueCount: input.revenue.length, expenseCount: input.expenses.length };
}

export interface BudgetForecastEntryRow {
  id: number;
  quarter_label: string;
  quarter_start_date: string;
  quarter_end_date: string;
  entry_type: 'revenue' | 'expense';
  category_id: number | null;
  category_name: string | null;
  label: string;
  estimated_amount_idr: number;
  notes: string | null;
  created_at: string;
}

export async function getForecastEntries(quarterStartDate: string): Promise<BudgetForecastEntryRow[]> {
  return (await sql`
    SELECT f.id, f.quarter_label, f.quarter_start_date::text, f.quarter_end_date::text, f.entry_type,
      f.category_id, bc.name AS category_name, f.label, f.estimated_amount_idr, f.notes, f.created_at::text
    FROM budget_forecast_entries f
    LEFT JOIN budget_categories bc ON bc.id = f.category_id
    WHERE f.quarter_start_date = ${quarterStartDate}::date
    ORDER BY f.entry_type, f.id
  `) as unknown as BudgetForecastEntryRow[];
}

export async function createForecastEntry(input: UpsertBudgetForecastEntryInput, createdBy: number): Promise<number> {
  const categoryId = input.entryType === 'expense' ? input.categoryId ?? null : null;
  const rows = await sql`
    INSERT INTO budget_forecast_entries (
      quarter_label, quarter_start_date, quarter_end_date, entry_type, category_id, label, estimated_amount_idr, notes, created_by
    )
    VALUES (
      ${input.quarterLabel}, ${input.quarterStartDate}::date, ${input.quarterEndDate}::date, ${input.entryType},
      ${categoryId}, ${input.label}, ${input.estimatedAmountIdr}, ${input.notes || null}, ${createdBy}
    )
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateForecastEntry(id: number, input: UpsertBudgetForecastEntryInput): Promise<void> {
  const categoryId = input.entryType === 'expense' ? input.categoryId ?? null : null;
  await sql`
    UPDATE budget_forecast_entries SET
      quarter_label = ${input.quarterLabel},
      quarter_start_date = ${input.quarterStartDate}::date,
      quarter_end_date = ${input.quarterEndDate}::date,
      entry_type = ${input.entryType},
      category_id = ${categoryId},
      label = ${input.label},
      estimated_amount_idr = ${input.estimatedAmountIdr},
      notes = ${input.notes || null},
      updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteForecastEntry(id: number): Promise<void> {
  await sql`DELETE FROM budget_forecast_entries WHERE id = ${id}`;
}

export interface ForecastSummary {
  revenue: BudgetForecastEntryRow[];
  expenses: BudgetForecastEntryRow[];
  totalRevenueIdr: number;
  totalExpensesIdr: number;
  netIdr: number;
  actualRevenueIdr: number;
  actualExpensesIdr: number;
}

/** actualRevenueIdr/actualExpensesIdr are what's really landed in budget_revenue/budget_expenses
 * so far within the same quarter date range, for a forecast-vs-actual comparison on the page —
 * zero for a quarter that hasn't started yet. */
export async function getForecastSummary(quarterStartDate: string, quarterEndDate: string): Promise<ForecastSummary> {
  const entries = await getForecastEntries(quarterStartDate);
  const revenue = entries.filter((e) => e.entry_type === 'revenue');
  const expenses = entries.filter((e) => e.entry_type === 'expense');
  const totalRevenueIdr = revenue.reduce((sum, e) => sum + Number(e.estimated_amount_idr), 0);
  const totalExpensesIdr = expenses.reduce((sum, e) => sum + Number(e.estimated_amount_idr), 0);

  const [actual] = (await sql`
    SELECT
      COALESCE((SELECT SUM(amount_idr) FROM budget_revenue WHERE entry_date BETWEEN ${quarterStartDate}::date AND ${quarterEndDate}::date), 0)::bigint AS revenue,
      COALESCE((SELECT SUM(amount_idr) FROM budget_expenses WHERE entry_date BETWEEN ${quarterStartDate}::date AND ${quarterEndDate}::date), 0)::bigint AS expenses
  `) as unknown as { revenue: number; expenses: number }[];

  return {
    revenue,
    expenses,
    totalRevenueIdr,
    totalExpensesIdr,
    netIdr: totalRevenueIdr - totalExpensesIdr,
    actualRevenueIdr: Number(actual.revenue),
    actualExpensesIdr: Number(actual.expenses),
  };
}

export interface ForecastExpenseSuggestion {
  categoryId: number;
  categoryName: string;
  suggestedAmountIdr: number;
}

/** The trailing 3 months' actual spend per category, as of `asOfDate` -- a starting point for a
 * new quarter's forecast (one quarter back standing in for the next one), not a final answer; the
 * admin edits or discards every suggested line on the way to actually creating forecast entries. */
export async function getForecastExpenseSuggestions(asOfDate: string): Promise<ForecastExpenseSuggestion[]> {
  const rows = (await sql`
    SELECT bc.id AS category_id, bc.name AS category_name,
      COALESCE(SUM(e.amount_idr), 0)::bigint AS total_last_3_months
    FROM budget_categories bc
    LEFT JOIN budget_expenses e ON e.category_id = bc.id
      AND e.entry_date >= (${asOfDate}::date - INTERVAL '3 months')
      AND e.entry_date < ${asOfDate}::date
    WHERE bc.is_archived = false
    GROUP BY bc.id, bc.name
    ORDER BY bc.name
  `) as unknown as { category_id: number; category_name: string; total_last_3_months: number }[];
  return rows
    .filter((r) => Number(r.total_last_3_months) > 0)
    .map((r) => ({ categoryId: r.category_id, categoryName: r.category_name, suggestedAmountIdr: Math.round(Number(r.total_last_3_months)) }));
}
