import { sql } from './db';
import type {
  UpsertSeranganEntryInput,
  UpsertSeranganBudgetInput,
  UpsertSeranganDonationInput,
  UpsertSeranganExpenditureInput,
  UpsertSeranganCampaignInput,
} from './validation';

export interface SeranganEntry {
  id: number;
  entry_date: string;
  activity: string;
  staff_present: string | null;
  visitors_present: string | null;
  children_count: number | null;
  boys_estimate: number | null;
  girls_estimate: number | null;
  age_estimate_note: string | null;
  notes: string | null;
  created_at: string;
}

export async function getRecentEntries(limit: number): Promise<SeranganEntry[]> {
  return (await sql`
    SELECT id, entry_date::text, activity, staff_present, visitors_present, children_count, boys_estimate, girls_estimate, age_estimate_note, notes, created_at::text
    FROM serangan_entries ORDER BY entry_date DESC, id DESC LIMIT ${limit}
  `) as unknown as SeranganEntry[];
}

export async function getEntriesForPeriod(start: string, end: string): Promise<SeranganEntry[]> {
  return (await sql`
    SELECT id, entry_date::text, activity, staff_present, visitors_present, children_count, boys_estimate, girls_estimate, age_estimate_note, notes, created_at::text
    FROM serangan_entries WHERE entry_date BETWEEN ${start} AND ${end}
    ORDER BY entry_date, id
  `) as unknown as SeranganEntry[];
}

export async function createEntry(input: UpsertSeranganEntryInput, createdBy: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO serangan_entries (entry_date, activity, staff_present, visitors_present, children_count, boys_estimate, girls_estimate, age_estimate_note, notes, created_by)
    VALUES (${input.entryDate}::date, ${input.activity}, ${input.staffPresent || null}, ${input.visitorsPresent || null},
      ${input.childrenCount ?? null}, ${input.boysEstimate ?? null}, ${input.girlsEstimate ?? null}, ${input.ageEstimateNote || null}, ${input.notes || null}, ${createdBy})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function updateEntry(id: number, input: UpsertSeranganEntryInput): Promise<void> {
  await sql`
    UPDATE serangan_entries
    SET entry_date = ${input.entryDate}::date, activity = ${input.activity}, staff_present = ${input.staffPresent || null},
        visitors_present = ${input.visitorsPresent || null}, children_count = ${input.childrenCount ?? null},
        boys_estimate = ${input.boysEstimate ?? null}, girls_estimate = ${input.girlsEstimate ?? null},
        age_estimate_note = ${input.ageEstimateNote || null}, notes = ${input.notes || null}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteEntry(id: number): Promise<void> {
  await sql`DELETE FROM serangan_entries WHERE id = ${id}`;
}

export interface SeranganBudget {
  year: number;
  budget_amount_idr: string;
  notes: string | null;
}

export async function getBudgetForYear(year: number): Promise<SeranganBudget> {
  const rows = (await sql`SELECT year, budget_amount_idr, notes FROM serangan_budgets WHERE year = ${year}`) as unknown as SeranganBudget[];
  return rows[0] ?? { year, budget_amount_idr: '0', notes: null };
}

export async function getAllBudgets(): Promise<SeranganBudget[]> {
  return (await sql`SELECT year, budget_amount_idr, notes FROM serangan_budgets ORDER BY year DESC`) as unknown as SeranganBudget[];
}

export async function upsertBudget(input: UpsertSeranganBudgetInput, updatedBy: number): Promise<void> {
  await sql`
    INSERT INTO serangan_budgets (year, budget_amount_idr, notes, updated_by)
    VALUES (${input.year}, ${input.budgetAmountIdr}, ${input.notes || null}, ${updatedBy})
    ON CONFLICT (year) DO UPDATE SET budget_amount_idr = ${input.budgetAmountIdr}, notes = ${input.notes || null}, updated_at = now(), updated_by = ${updatedBy}
  `;
}

export interface SeranganDonation {
  id: number;
  donation_date: string;
  donor_name: string | null;
  amount_idr: string;
  notes: string | null;
}

export async function getRecentDonations(limit: number): Promise<SeranganDonation[]> {
  return (await sql`
    SELECT id, donation_date::text, donor_name, amount_idr, notes FROM serangan_donations ORDER BY donation_date DESC, id DESC LIMIT ${limit}
  `) as unknown as SeranganDonation[];
}

export async function getDonationsForPeriod(start: string, end: string): Promise<SeranganDonation[]> {
  return (await sql`
    SELECT id, donation_date::text, donor_name, amount_idr, notes FROM serangan_donations
    WHERE donation_date BETWEEN ${start} AND ${end} ORDER BY donation_date, id
  `) as unknown as SeranganDonation[];
}

export async function createDonation(input: UpsertSeranganDonationInput, createdBy: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO serangan_donations (donation_date, donor_name, amount_idr, notes, created_by)
    VALUES (${input.donationDate}::date, ${input.donorName || null}, ${input.amountIdr}, ${input.notes || null}, ${createdBy})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function deleteDonation(id: number): Promise<void> {
  await sql`DELETE FROM serangan_donations WHERE id = ${id}`;
}

export interface SeranganExpenditure {
  id: number;
  expense_date: string;
  category: string | null;
  description: string;
  amount_idr: string;
}

export async function getRecentExpenditures(limit: number): Promise<SeranganExpenditure[]> {
  return (await sql`
    SELECT id, expense_date::text, category, description, amount_idr FROM serangan_expenditures ORDER BY expense_date DESC, id DESC LIMIT ${limit}
  `) as unknown as SeranganExpenditure[];
}

export async function getExpendituresForPeriod(start: string, end: string): Promise<SeranganExpenditure[]> {
  return (await sql`
    SELECT id, expense_date::text, category, description, amount_idr FROM serangan_expenditures
    WHERE expense_date BETWEEN ${start} AND ${end} ORDER BY expense_date, id
  `) as unknown as SeranganExpenditure[];
}

export async function createExpenditure(input: UpsertSeranganExpenditureInput, createdBy: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO serangan_expenditures (expense_date, category, description, amount_idr, created_by)
    VALUES (${input.expenseDate}::date, ${input.category || null}, ${input.description}, ${input.amountIdr}, ${createdBy})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function deleteExpenditure(id: number): Promise<void> {
  await sql`DELETE FROM serangan_expenditures WHERE id = ${id}`;
}

export interface SeranganCampaign {
  id: number;
  title: string;
  description: string | null;
  status: 'planned' | 'active' | 'completed';
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export async function getAllCampaigns(): Promise<SeranganCampaign[]> {
  return (await sql`
    SELECT id, title, description, status, start_date::text, end_date::text, notes, created_at::text
    FROM serangan_campaigns ORDER BY created_at DESC
  `) as unknown as SeranganCampaign[];
}

/** Campaigns whose active window overlaps the report period at all -- a campaign with no
 * start/end date set yet (still just an idea) is never included, since it has no window to
 * overlap with. */
export async function getCampaignsOverlappingPeriod(start: string, end: string): Promise<SeranganCampaign[]> {
  return (await sql`
    SELECT id, title, description, status, start_date::text, end_date::text, notes, created_at::text
    FROM serangan_campaigns
    WHERE start_date IS NOT NULL AND start_date <= ${end} AND (end_date IS NULL OR end_date >= ${start})
    ORDER BY start_date, id
  `) as unknown as SeranganCampaign[];
}

export async function createCampaign(input: UpsertSeranganCampaignInput, createdBy: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO serangan_campaigns (title, description, status, start_date, end_date, notes, created_by)
    VALUES (${input.title}, ${input.description || null}, ${input.status}, ${input.startDate || null}::date, ${input.endDate || null}::date, ${input.notes || null}, ${createdBy})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function updateCampaign(id: number, input: UpsertSeranganCampaignInput): Promise<void> {
  await sql`
    UPDATE serangan_campaigns
    SET title = ${input.title}, description = ${input.description || null}, status = ${input.status},
        start_date = ${input.startDate || null}::date, end_date = ${input.endDate || null}::date, notes = ${input.notes || null}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteCampaign(id: number): Promise<void> {
  await sql`DELETE FROM serangan_campaigns WHERE id = ${id}`;
}

export interface SeranganReportData {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  entries: SeranganEntry[];
  sessionsCount: number;
  totalChildrenAttendance: number;
  avgChildrenPerSession: number;
  totalBoys: number;
  totalGirls: number;
  donations: SeranganDonation[];
  donationsTotal: number;
  expenditures: SeranganExpenditure[];
  expenditureTotal: number;
  campaigns: SeranganCampaign[];
  annualBudget: SeranganBudget;
}

export async function getSeranganReportData(periodStart: string, periodEnd: string, periodLabel: string): Promise<SeranganReportData> {
  const year = Number(periodStart.slice(0, 4));
  const [entries, donations, expenditures, campaigns, annualBudget] = await Promise.all([
    getEntriesForPeriod(periodStart, periodEnd),
    getDonationsForPeriod(periodStart, periodEnd),
    getExpendituresForPeriod(periodStart, periodEnd),
    getCampaignsOverlappingPeriod(periodStart, periodEnd),
    getBudgetForYear(year),
  ]);

  const sessionsCount = entries.length;
  const totalChildrenAttendance = entries.reduce((sum, e) => sum + (e.children_count ?? 0), 0);
  const totalBoys = entries.reduce((sum, e) => sum + (e.boys_estimate ?? 0), 0);
  const totalGirls = entries.reduce((sum, e) => sum + (e.girls_estimate ?? 0), 0);
  const donationsTotal = donations.reduce((sum, d) => sum + Number(d.amount_idr), 0);
  const expenditureTotal = expenditures.reduce((sum, e) => sum + Number(e.amount_idr), 0);

  return {
    periodLabel,
    periodStart,
    periodEnd,
    entries,
    sessionsCount,
    totalChildrenAttendance,
    avgChildrenPerSession: sessionsCount > 0 ? Math.round((totalChildrenAttendance / sessionsCount) * 10) / 10 : 0,
    totalBoys,
    totalGirls,
    donations,
    donationsTotal,
    expenditures,
    expenditureTotal,
    campaigns,
    annualBudget,
  };
}
