import { ensureSchema, sql } from '../src/lib/db';
import { getBudgetCategories, getBudgetSettings, updateBudgetSettings, createBudgetImportBatch } from '../src/lib/budget';

/**
 * One-off import of the real bank/Wise statements reviewed with the school in September 2026:
 *   - Mandiri 1610017501474 (Yayasan Selong Bay S, main account), 01 Jun 2026 - 16 Sep 2026 --
 *     every one of its 75 transactions (19 debit, 56 credit), categorized during that review.
 *   - Wise IDR 98636273 (mixed personal/other-project account) -- only the ONE transaction
 *     confirmed as school-related: a tuition-style receipt from Kristina Neumann.
 *   - Wise NZD 04-2021-0290309-08 -- only the transactions confirmed as school-related: a lunch
 *     invoice receipt from Annalise Kate Fleming, and two payments to Rebecca Kate Furness.
 *
 * Deliberately NOT imported (see the chat conversation this script came out of for the reasoning):
 *   - Mandiri 1610016965134 (Elizabeth Kristal Berryman's operating/disbursement account) -- its
 *     funding transfers from account ...1474 are already booked as expenses at the point they left
 *     ...1474 (the "GNC"/"KE ELIZABETH KRISTAL BERRYMAN" lines below), so importing this account's
 *     own transactions too would double-count the same money as spent twice. This was an explicit
 *     choice, not an oversight -- the trade-off is that "Staff Salaries & Wages" and
 *     "Reimbursements" end up as lump sums rather than reflecting exactly what was bought
 *     downstream (groceries, activities, homestays, etc.).
 *   - Every other Wise IDR/NZD transaction not listed above -- confirmed as personal or
 *     unrelated-project spending (a "Serangan" property/construction project, resort stays,
 *     restaurants, personal subscriptions, NZD currency conversions), not school business.
 *
 * A handful of interest/tax lines in the Mandiri statement carry fractional rupiah (e.g.
 * 1,626.34) -- amount_idr is BIGINT, so these are rounded to the nearest rupiah. The two Wise NZD
 * amounts are converted to IDR using the nearest same-period Wise conversion rate found in that
 * statement (there's no exact rate for those exact timestamps) -- both are flagged as
 * approximate in their own description text so they're easy to find and correct precisely later.
 *
 * All three totals below were checked against each statement's own reported summary before
 * writing this script (Mandiri: 56 credits / 19 debits / totals to the rupiah; both confirmed
 * against the PDF's own "Account Statement Summary" block) -- see assertTotals().
 *
 * Sets budget_settings.opening_cash_idr to 0 as of 2026-06-01 on --apply, since that's the
 * Mandiri main account's own opening balance on its statement's first day, and no earlier
 * transaction date exists anywhere in this import -- cash on hand becomes fully derived from
 * these entries with no unverified baseline figure.
 *
 * Usage:
 *   npm run db:import-bank-statements                        (dry run -- prints the plan, changes nothing)
 *   npm run db:import-bank-statements -- --apply              (actually performs the import)
 *   npm run db:import-bank-statements -- --apply --email=you@example.com   (attribute to a specific admin)
 */

interface RevenueRow {
  entryDate: string;
  amountIdr: number;
  payerSource: string;
  description?: string;
}
interface ExpenseRow {
  entryDate: string;
  amountIdr: number;
  categoryName: string;
  vendorDescription: string;
  authorizedBy: string;
}

const MANDIRI_REVENUE: RevenueRow[] = [
  { entryDate: '2026-06-10', amountIdr: 38553850, payerSource: 'Erik Barreto' },
  { entryDate: '2026-06-18', amountIdr: 5600000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-06-23', amountIdr: 6900000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-06-23', amountIdr: 8625000, payerSource: 'Bank transfer (ref 0100205263)' },
  { entryDate: '2026-06-30', amountIdr: 8132, payerSource: 'Bank Mandiri', description: 'Interest earned' },
  { entryDate: '2026-07-03', amountIdr: 2000000, payerSource: 'Chloe Barreto' },
  { entryDate: '2026-07-03', amountIdr: 2000000, payerSource: 'Chloe Barreto' },
  { entryDate: '2026-07-07', amountIdr: 400000, payerSource: 'Bank transfer (ref 4843706885)' },
  { entryDate: '2026-07-07', amountIdr: 400000, payerSource: 'Narbaety Tyas Arifiyanti' },
  { entryDate: '2026-07-19', amountIdr: 2000000, payerSource: 'Yustika Sari Noor' },
  { entryDate: '2026-07-20', amountIdr: 12350000, payerSource: 'Dylan Joseph Maley' },
  { entryDate: '2026-07-23', amountIdr: 42868750, payerSource: 'Elodie Chloe Severini' },
  { entryDate: '2026-07-23', amountIdr: 900000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-07-25', amountIdr: 1875000, payerSource: 'Ulfa Kurnia Sari Reinart' },
  { entryDate: '2026-07-26', amountIdr: 14760000, payerSource: 'Bank transfer (ref 5002168141)' },
  { entryDate: '2026-07-26', amountIdr: 1800000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-07-26', amountIdr: 2000000, payerSource: 'Bank transfer (ref 5006834831)' },
  { entryDate: '2026-07-29', amountIdr: 3060000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-07-31', amountIdr: 15437, payerSource: 'Bank Mandiri', description: 'Interest earned' },
  { entryDate: '2026-08-03', amountIdr: 35000, payerSource: 'Amorita Christella Anggamsari' },
  { entryDate: '2026-08-04', amountIdr: 18450000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-08-04', amountIdr: 2535000, payerSource: 'Gilles Bruno Oberhansli' },
  { entryDate: '2026-08-04', amountIdr: 1600000, payerSource: 'Bank transfer (ref 5094804947)' },
  { entryDate: '2026-08-04', amountIdr: 175000, payerSource: 'Indhira Shinta Dewi' },
  { entryDate: '2026-08-05', amountIdr: 45000, payerSource: 'Ulfa Kurnia Sari Reinart' },
  { entryDate: '2026-08-07', amountIdr: 3240000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-08-09', amountIdr: 180000, payerSource: 'Gilles Bruno Oberhansli' },
  { entryDate: '2026-08-10', amountIdr: 225000, payerSource: 'Bank transfer (ref 5149526620)' },
  { entryDate: '2026-08-10', amountIdr: 120000, payerSource: 'Gilles Bruno Oberhansli' },
  { entryDate: '2026-08-10', amountIdr: 150000, payerSource: 'Ni Kadek Odik Lestari' },
  { entryDate: '2026-08-13', amountIdr: 70000, payerSource: 'Mariatunhasa Nahspd' },
  { entryDate: '2026-08-13', amountIdr: 35000, payerSource: 'Dewi Mustika Ningrum' },
  { entryDate: '2026-08-13', amountIdr: 210000, payerSource: 'Indhira Sintha Dewi' },
  { entryDate: '2026-08-18', amountIdr: 90000, payerSource: 'PT. Chee Chas' },
  { entryDate: '2026-08-19', amountIdr: 1185000, payerSource: 'Mimpi Family Lombok', description: 'Food' },
  { entryDate: '2026-08-22', amountIdr: 180000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-08-24', amountIdr: 210000, payerSource: 'Indhira Shinta Dewi' },
  { entryDate: '2026-08-25', amountIdr: 35000, payerSource: 'Dewi Mustika Ningrum' },
  { entryDate: '2026-08-26', amountIdr: 45000, payerSource: 'PT. Chee Chas' },
  { entryDate: '2026-08-26', amountIdr: 135000, payerSource: 'PT. Chee Chas' },
  { entryDate: '2026-08-26', amountIdr: 495000, payerSource: 'Gary Michael Torrens' },
  { entryDate: '2026-08-28', amountIdr: 180000, payerSource: 'Chloe Barreto' },
  { entryDate: '2026-08-28', amountIdr: 3795000, payerSource: 'Ignacio Javier Catalan Sanchez' },
  { entryDate: '2026-08-30', amountIdr: 800000, payerSource: 'Mimpi Family Lombok' },
  { entryDate: '2026-08-31', amountIdr: 31138, payerSource: 'Bank Mandiri', description: 'Interest earned' },
  { entryDate: '2026-09-03', amountIdr: 11880000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-09-06', amountIdr: 12480000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-09-07', amountIdr: 2970000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-09-07', amountIdr: 3270000, payerSource: 'Wise Payments Indonesia' },
  { entryDate: '2026-09-07', amountIdr: 600000, payerSource: 'Chee Chas' },
  { entryDate: '2026-09-07', amountIdr: 135000, payerSource: 'Chee Chas' },
  { entryDate: '2026-09-13', amountIdr: 180000, payerSource: 'Chloe Barreto' },
  { entryDate: '2026-09-14', amountIdr: 35000, payerSource: 'Mariatunhasa Nahspd' },
  { entryDate: '2026-09-14', amountIdr: 775000, payerSource: 'Mimpi Family Lombok', description: 'Lunch' },
  { entryDate: '2026-09-14', amountIdr: 3500000, payerSource: 'Saba Lombok Indonesia', description: 'Office table' },
  { entryDate: '2026-09-14', amountIdr: 2080000, payerSource: 'Bank transfer (BCA)' },
];

const MANDIRI_EXPENSES: ExpenseRow[] = [
  { entryDate: '2026-06-30', amountIdr: 13000, categoryName: 'Bank Fees & Charges', vendorDescription: 'Biaya Adm (monthly bank admin fee)', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-06-30', amountIdr: 1626, categoryName: 'Bank Fees & Charges', vendorDescription: 'Pajak (tax on interest)', authorizedBy: 'Bank Mandiri' },
  {
    entryDate: '2026-07-10',
    amountIdr: 50000000,
    categoryName: 'Reimbursements',
    vendorDescription: 'Monthly Management — reimbursement of costs Elizabeth Kristal Berryman personally incurred in Q2 2026',
    authorizedBy: 'Elizabeth Kristal Berryman',
  },
  { entryDate: '2026-07-25', amountIdr: 5967000, categoryName: 'School Supplies & Equipment', vendorDescription: 'Cambridge Curriculum invoice INV/2026/0079 (Pacifica Intirama CV)', authorizedBy: 'Bank transfer' },
  { entryDate: '2026-07-25', amountIdr: 2500, categoryName: 'Bank Fees & Charges', vendorDescription: 'Transfer fee (Cambridge Curriculum payment)', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-07-31', amountIdr: 2500, categoryName: 'Bank Fees & Charges', vendorDescription: 'Transaction fee', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-07-31', amountIdr: 20561216, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-07-31', amountIdr: 13000, categoryName: 'Bank Fees & Charges', vendorDescription: 'Biaya Adm (monthly bank admin fee)', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-07-31', amountIdr: 3087, categoryName: 'Bank Fees & Charges', vendorDescription: 'Pajak (tax on interest)', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-08-30', amountIdr: 20066750, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-08-30', amountIdr: 8600000, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-08-30', amountIdr: 3750000, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-08-30', amountIdr: 4600000, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-08-30', amountIdr: 3500000, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-08-30', amountIdr: 8600000, categoryName: 'Staff Salaries & Wages', vendorDescription: 'Staff payroll transfer (GNC)', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-08-31', amountIdr: 13000, categoryName: 'Bank Fees & Charges', vendorDescription: 'Biaya Adm (monthly bank admin fee)', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-08-31', amountIdr: 6228, categoryName: 'Bank Fees & Charges', vendorDescription: 'Pajak (tax on interest)', authorizedBy: 'Bank Mandiri' },
  { entryDate: '2026-09-09', amountIdr: 23199000, categoryName: 'School Supplies & Equipment', vendorDescription: 'Apple MacBook Air — reimbursed to Elizabeth Kristal Berryman', authorizedBy: 'Elizabeth Kristal Berryman' },
  { entryDate: '2026-09-16', amountIdr: 2050000, categoryName: 'Reimbursements', vendorDescription: 'Monty refund — reimbursed to Elizabeth Kristal Berryman', authorizedBy: 'Elizabeth Kristal Berryman' },
];

// Wise IDR 98636273 (mixed account) -- only the confirmed school-related line.
const WISE_IDR_REVENUE: RevenueRow[] = [
  { entryDate: '2026-08-01', amountIdr: 440000, payerSource: 'Kristina Neumann', description: 'Received via Wise (IDR)' },
];

// Wise NZD 04-2021-0290309-08 -- only the confirmed school-related lines. NZD amounts converted
// to IDR using the nearest same-period Wise conversion rate found in that statement (no exact
// rate exists for these exact timestamps) -- flagged as approximate for later correction if needed.
const WISE_NZD_REVENUE: RevenueRow[] = [
  {
    entryDate: '2026-08-21',
    amountIdr: 89843,
    payerSource: 'Annalise Kate Fleming',
    description: "Invoice 038 Monty Lunches -- 8.51 NZD, converted at ~10,557.32 IDR/NZD (21 Aug rate, same day); approximate",
  },
];
const WISE_NZD_EXPENSES: ExpenseRow[] = [
  {
    entryDate: '2026-08-20',
    amountIdr: 4222928,
    categoryName: 'Reimbursements',
    vendorDescription: 'Payment to Rebecca Kate Furness -- 400.00 NZD, converted at ~10,557.32 IDR/NZD (21 Aug rate, nearest available); approximate. Category is a placeholder -- recategorize if a more specific one fits.',
    authorizedBy: 'Elizabeth Kristal Berryman',
  },
  {
    entryDate: '2026-08-25',
    amountIdr: 1579497,
    categoryName: 'Reimbursements',
    vendorDescription: 'Payment to Rebecca Kate Furness -- 150.00 NZD, converted at ~10,529.98 IDR/NZD (28 Aug rate, nearest available); approximate. Category is a placeholder -- recategorize if a more specific one fits.',
    authorizedBy: 'Elizabeth Kristal Berryman',
  },
];

function sum(rows: { amountIdr: number }[]): number {
  return rows.reduce((total, r) => total + r.amountIdr, 0);
}

/** Cross-checks the transcribed Mandiri data against the statement's own reported summary
 * (No. of Credit: 56, Total Amount Credited: 218,272,307.11; No. of Debit: 19, Total Amount
 * Debited: 150,948,907.42) before anything gets written -- small differences are expected from
 * rounding fractional-rupiah interest/tax lines to whole rupiah, but a large mismatch means a
 * transcription error and this refuses to proceed. */
function assertMandiriTotals() {
  const creditTotal = sum(MANDIRI_REVENUE);
  const debitTotal = sum(MANDIRI_EXPENSES);
  const expectedCredit = 218272307.11;
  const expectedDebit = 150948907.42;

  if (MANDIRI_REVENUE.length !== 56) throw new Error(`Expected 56 Mandiri credit rows, got ${MANDIRI_REVENUE.length}`);
  if (MANDIRI_EXPENSES.length !== 19) throw new Error(`Expected 19 Mandiri debit rows, got ${MANDIRI_EXPENSES.length}`);
  if (Math.abs(creditTotal - expectedCredit) > 5) {
    throw new Error(`Mandiri credit total ${creditTotal} is too far from the statement's reported ${expectedCredit} -- check the data above.`);
  }
  if (Math.abs(debitTotal - expectedDebit) > 5) {
    throw new Error(`Mandiri debit total ${debitTotal} is too far from the statement's reported ${expectedDebit} -- check the data above.`);
  }

  console.log(`Mandiri totals verified: ${MANDIRI_REVENUE.length} credits = Rp ${creditTotal.toLocaleString('en-US')} (statement: ${expectedCredit}), ${MANDIRI_EXPENSES.length} debits = Rp ${debitTotal.toLocaleString('en-US')} (statement: ${expectedDebit})`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const emailArg = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1];

  assertMandiriTotals();
  await ensureSchema();

  const categories = await getBudgetCategories(true);
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const resolveCategory = (name: string): number => {
    const id = categoryIdByName.get(name);
    if (!id) throw new Error(`Category "${name}" not found -- has the schema migration run yet?`);
    return id;
  };

  let importer: { id: number; email: string } | undefined;
  if (emailArg) {
    const rows = (await sql`SELECT id, email FROM admin_users WHERE lower(email) = lower(${emailArg})`) as unknown as { id: number; email: string }[];
    importer = rows[0];
    if (!importer) throw new Error(`No admin_users row for ${emailArg}`);
  } else {
    const rows = (await sql`SELECT id, email FROM admin_users WHERE role = 'admin' ORDER BY id LIMIT 1`) as unknown as { id: number; email: string }[];
    importer = rows[0];
    if (!importer) throw new Error('No admin found in admin_users to attribute this import to -- pass --email=you@example.com');
  }
  console.log(`Attributing this import to ${importer.email} (admin_users.id=${importer.id}).`);

  const batches: {
    sourceLabel: string;
    periodStart: string;
    periodEnd: string;
    openingBalanceIdr: number;
    closingBalanceIdr: number;
    revenue: RevenueRow[];
    expenses: ExpenseRow[];
  }[] = [
    {
      sourceLabel: 'Mandiri 1610017501474 (Yayasan Selong Bay S)',
      periodStart: '2026-06-01',
      periodEnd: '2026-09-16',
      openingBalanceIdr: 0,
      closingBalanceIdr: 67323400,
      revenue: MANDIRI_REVENUE,
      expenses: MANDIRI_EXPENSES,
    },
    {
      sourceLabel: 'Wise IDR 98636273 (school-related lines only)',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      openingBalanceIdr: 0,
      closingBalanceIdr: 0,
      revenue: WISE_IDR_REVENUE,
      expenses: [],
    },
    {
      sourceLabel: 'Wise NZD 04-2021-0290309-08 (school-related lines only)',
      periodStart: '2026-08-01',
      periodEnd: '2026-09-19',
      openingBalanceIdr: 0,
      closingBalanceIdr: 0,
      revenue: WISE_NZD_REVENUE,
      expenses: WISE_NZD_EXPENSES,
    },
  ];

  for (const batch of batches) {
    const revenueTotal = sum(batch.revenue);
    const expenseTotal = sum(batch.expenses);
    console.log(
      `\n${batch.sourceLabel} (${batch.periodStart} to ${batch.periodEnd}): ${batch.revenue.length} revenue row(s) = Rp ${revenueTotal.toLocaleString('en-US')}, ${batch.expenses.length} expense row(s) = Rp ${expenseTotal.toLocaleString('en-US')}`
    );

    if (apply) {
      const result = await createBudgetImportBatch(
        {
          sourceLabel: batch.sourceLabel,
          periodStart: batch.periodStart,
          periodEnd: batch.periodEnd,
          openingBalanceIdr: batch.openingBalanceIdr,
          closingBalanceIdr: batch.closingBalanceIdr,
          revenue: batch.revenue.map((r) => ({ entryDate: r.entryDate, amountIdr: r.amountIdr, payerSource: r.payerSource, description: r.description })),
          expenses: batch.expenses.map((e) => ({
            entryDate: e.entryDate,
            amountIdr: e.amountIdr,
            categoryId: resolveCategory(e.categoryName),
            vendorDescription: e.vendorDescription,
            authorizedBy: e.authorizedBy,
          })),
        },
        importer.id
      );
      console.log(`  -> imported as batch #${result.batchId}: ${result.revenueCount} revenue, ${result.expenseCount} expense row(s).`);
    }
  }

  if (apply) {
    const existing = await getBudgetSettings();
    await updateBudgetSettings({
      termLabel: existing.term_label,
      termStartDate: existing.term_start_date,
      termEndDate: existing.term_end_date,
      openingCashIdr: 0,
      openingCashAsOf: '2026-06-01',
    });
    console.log(
      `\nUpdated Budget Setup's opening cash to Rp 0 as of 2026-06-01 (the Mandiri main account's own statement opening balance -- the earliest transaction date across everything imported). Cash on hand is now fully derived from these entries.`
    );
  } else {
    console.log(
      `\nDry run only -- nothing written. Re-run with --apply to actually import these ${batches.reduce((n, b) => n + b.revenue.length + b.expenses.length, 0)} transactions and reset Budget Setup's opening cash to Rp 0 as of 2026-06-01.`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
