import { sql } from './db';

export interface LibrarySettings {
  monthly_membership_fee_idr: number;
  default_loan_period_days: number;
  late_fee_per_day_idr: number;
  late_fee_cap_idr: number | null;
  invoice_due_days: number;
}

export async function getLibrarySettings(): Promise<LibrarySettings> {
  const rows = (await sql`SELECT * FROM library_settings WHERE id = 1`) as unknown as LibrarySettings[];
  return rows[0];
}

/** Pure day-count math shared by the live estimate shown on an active loan and the amount frozen
 * onto the loan once it's actually returned — see returnLibraryLoan below. Never negative. */
export function calculateLateFee(daysLate: number, settings: LibrarySettings): number {
  if (daysLate <= 0 || settings.late_fee_per_day_idr <= 0) return 0;
  const raw = daysLate * settings.late_fee_per_day_idr;
  return settings.late_fee_cap_idr != null ? Math.min(raw, settings.late_fee_cap_idr) : raw;
}

async function nextInvoiceNumber(): Promise<number> {
  const [{ nextval }] = (await sql`SELECT nextval('invoice_number_seq') AS nextval`) as unknown as { nextval: number }[];
  return nextval;
}

export interface LibraryMembership {
  id: number;
  customer_id: number;
  status: 'active' | 'cancelled';
  monthly_fee_idr: number;
  discount_percent: number;
  discount_code_id: number | null;
  joined_at: string;
  next_billing_date: string;
  cancelled_at: string | null;
}

export async function getMembershipForCustomer(customerId: number): Promise<LibraryMembership | null> {
  const rows = (await sql`
    SELECT id, customer_id, status, monthly_fee_idr, discount_percent, discount_code_id,
      joined_at::text, next_billing_date::text, cancelled_at::text
    FROM library_memberships WHERE customer_id = ${customerId}
  `) as unknown as LibraryMembership[];
  return rows[0] ?? null;
}

function effectiveMonthlyFee(m: Pick<LibraryMembership, 'monthly_fee_idr' | 'discount_percent'>): number {
  return Math.round(m.monthly_fee_idr * (1 - m.discount_percent / 100));
}

export { effectiveMonthlyFee };

/** Creates the membership row the first time a family joins, or reactivates a previously
 * cancelled one — both re-snapshot the *current* default fee from library_settings rather than
 * reusing whatever was frozen on the row before, since a cancelled membership carries no live
 * pricing commitment. Billing starts today: the very next runLibraryBilling() pass invoices this
 * month. Discount, if any, survives a reactivation (redeemed codes aren't re-entered). */
export async function joinLibraryMembership(customerId: number): Promise<LibraryMembership> {
  const settings = await getLibrarySettings();
  const existing = await getMembershipForCustomer(customerId);
  if (existing && existing.status === 'active') return existing;

  if (existing) {
    const rows = (await sql`
      UPDATE library_memberships
      SET status = 'active', monthly_fee_idr = ${settings.monthly_membership_fee_idr},
        joined_at = CURRENT_DATE, next_billing_date = CURRENT_DATE, cancelled_at = NULL
      WHERE id = ${existing.id}
      RETURNING id, customer_id, status, monthly_fee_idr, discount_percent, discount_code_id,
        joined_at::text, next_billing_date::text, cancelled_at::text
    `) as unknown as LibraryMembership[];
    return rows[0];
  }

  const rows = (await sql`
    INSERT INTO library_memberships (customer_id, status, monthly_fee_idr, joined_at, next_billing_date)
    VALUES (${customerId}, 'active', ${settings.monthly_membership_fee_idr}, CURRENT_DATE, CURRENT_DATE)
    RETURNING id, customer_id, status, monthly_fee_idr, discount_percent, discount_code_id,
      joined_at::text, next_billing_date::text, cancelled_at::text
  `) as unknown as LibraryMembership[];
  return rows[0];
}

export async function cancelLibraryMembership(customerId: number): Promise<void> {
  await sql`UPDATE library_memberships SET status = 'cancelled', cancelled_at = CURRENT_DATE WHERE customer_id = ${customerId} AND status = 'active'`;
}

export class DiscountCodeError extends Error {}

/** Applies a code's percent-off to the family's own membership row (not shared/global — see the
 * table's per-code times_redeemed counter, which this increments once per successful redemption).
 * A parent can only ever have one code applied at a time; redeeming a second code replaces the
 * first rather than stacking, since these are meant as a single long-term-family discount, not a
 * coupon system. */
export async function redeemLibraryDiscountCode(customerId: number, rawCode: string): Promise<LibraryMembership> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new DiscountCodeError('Enter a code.');

  const codeRows = (await sql`
    SELECT id, discount_percent, max_redemptions, times_redeemed, expires_at::text, is_active
    FROM library_discount_codes WHERE upper(code) = ${code}
  `) as unknown as {
    id: number;
    discount_percent: number;
    max_redemptions: number | null;
    times_redeemed: number;
    expires_at: string | null;
    is_active: boolean;
  }[];
  const found = codeRows[0];
  if (!found || !found.is_active) throw new DiscountCodeError('That code isn’t valid.');
  if (found.expires_at && new Date(found.expires_at) < new Date()) throw new DiscountCodeError('That code has expired.');
  if (found.max_redemptions != null && found.times_redeemed >= found.max_redemptions) {
    throw new DiscountCodeError('That code has already been fully redeemed.');
  }

  const membership = await getMembershipForCustomer(customerId);
  if (!membership || membership.status !== 'active') {
    throw new DiscountCodeError('Join the library first, then enter your code.');
  }
  if (membership.discount_code_id === found.id) {
    throw new DiscountCodeError('That code is already applied to your membership.');
  }

  await sql`UPDATE library_discount_codes SET times_redeemed = times_redeemed + 1 WHERE id = ${found.id}`;
  const rows = (await sql`
    UPDATE library_memberships
    SET discount_percent = ${found.discount_percent}, discount_code_id = ${found.id}
    WHERE id = ${membership.id}
    RETURNING id, customer_id, status, monthly_fee_idr, discount_percent, discount_code_id,
      joined_at::text, next_billing_date::text, cancelled_at::text
  `) as unknown as LibraryMembership[];
  return rows[0];
}

/** Bills every membership whose next_billing_date has arrived, one calendar month at a time —
 * called from the daily cron (see /api/cron/library-billing) and from the manual "Run billing
 * now" admin button. Idempotent by construction: next_billing_date only moves forward once an
 * invoice for that period actually gets created, so re-running this on the same day never
 * double-bills. A membership discounted to 0 skips invoicing entirely (nothing to collect) but
 * still advances, so it doesn't pile up months of $0 "invoices". */
export async function runLibraryBilling(): Promise<{ billed: number; skipped: number }> {
  const memberships = (await sql`
    SELECT id, customer_id, monthly_fee_idr, discount_percent, next_billing_date::text
    FROM library_memberships WHERE status = 'active' AND next_billing_date <= CURRENT_DATE
  `) as unknown as { id: number; customer_id: number; monthly_fee_idr: number; discount_percent: number; next_billing_date: string }[];

  const settings = await getLibrarySettings();
  let billed = 0;
  let skipped = 0;

  for (const m of memberships) {
    const amount = effectiveMonthlyFee(m);
    if (amount > 0) {
      const customerRows = (await sql`SELECT name, email FROM customers WHERE id = ${m.customer_id}`) as unknown as {
        name: string | null;
        email: string;
      }[];
      const billedToName = customerRows[0]?.name || customerRows[0]?.email || 'Library member';
      const childRows = (await sql`
        SELECT child_id FROM guardian_children WHERE customer_id = ${m.customer_id} AND status = 'approved'
      `) as unknown as { child_id: number }[];

      const invoiceNumber = await nextInvoiceNumber();
      const periodLabel = new Date(`${m.next_billing_date}T00:00:00Z`).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      const invoiceRows = await sql`
        INSERT INTO invoices (invoice_number, invoice_type, billed_to_name, issue_date, due_date, subtotal_amount, sibling_discount_amount, total_amount)
        VALUES (
          ${invoiceNumber}, 'library', ${billedToName}, CURRENT_DATE,
          (CURRENT_DATE + (${settings.invoice_due_days} || ' days')::interval)::date,
          ${amount}, 0, ${amount}
        )
        RETURNING id
      `;
      const invoiceId = invoiceRows[0].id as number;
      await sql`
        INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, line_total, sort_order)
        VALUES (${invoiceId}, ${`Library membership – ${periodLabel}`}, 1, ${amount}, ${amount}, 0)
      `;
      for (const child of childRows) {
        await sql`INSERT INTO invoice_children (invoice_id, child_id, discount_percent, sort_order) VALUES (${invoiceId}, ${child.child_id}, 0, 0)`;
      }
      billed += 1;
    } else {
      skipped += 1;
    }
    await sql`UPDATE library_memberships SET next_billing_date = (next_billing_date + interval '1 month')::date WHERE id = ${m.id}`;
  }

  return { billed, skipped };
}

export interface LibraryLoanRow {
  id: number;
  item_id: number;
  item_title: string;
  item_type: 'book' | 'toy' | 'sports_equipment';
  child_id: number;
  child_full_name: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  late_fee_charged_idr: number | null;
  late_fee_waived: boolean;
  late_fee_invoice_id: number | null;
  days_overdue: number;
  estimated_late_fee_idr: number;
}

async function withEstimatedFee(rows: Omit<LibraryLoanRow, 'estimated_late_fee_idr'>[]): Promise<LibraryLoanRow[]> {
  const settings = await getLibrarySettings();
  return rows.map((row) => ({
    ...row,
    estimated_late_fee_idr: row.returned_at ? (row.late_fee_charged_idr ?? 0) : calculateLateFee(row.days_overdue, settings),
  }));
}

export async function getLoansForChildren(childIds: number[]): Promise<LibraryLoanRow[]> {
  if (childIds.length === 0) return [];
  const rows = (await sql`
    SELECT l.id, l.item_id, li.title AS item_title, li.item_type, l.child_id, c.child_full_name,
      l.borrowed_at::text, l.due_date::text, l.returned_at::text,
      l.late_fee_charged_idr, l.late_fee_waived, l.late_fee_invoice_id,
      GREATEST(0, (COALESCE(l.returned_at, CURRENT_DATE) - l.due_date))::int AS days_overdue
    FROM library_loans l
    JOIN library_items li ON li.id = l.item_id
    JOIN children c ON c.id = l.child_id
    WHERE l.child_id = ANY(${childIds})
    ORDER BY l.returned_at IS NULL DESC, l.due_date ASC
  `) as unknown as Omit<LibraryLoanRow, 'estimated_late_fee_idr'>[];
  return withEstimatedFee(rows);
}

export async function getAllLoans(): Promise<LibraryLoanRow[]> {
  const rows = (await sql`
    SELECT l.id, l.item_id, li.title AS item_title, li.item_type, l.child_id, c.child_full_name,
      l.borrowed_at::text, l.due_date::text, l.returned_at::text,
      l.late_fee_charged_idr, l.late_fee_waived, l.late_fee_invoice_id,
      GREATEST(0, (COALESCE(l.returned_at, CURRENT_DATE) - l.due_date))::int AS days_overdue
    FROM library_loans l
    JOIN library_items li ON li.id = l.item_id
    JOIN children c ON c.id = l.child_id
    ORDER BY l.returned_at IS NULL DESC, l.due_date ASC
  `) as unknown as Omit<LibraryLoanRow, 'estimated_late_fee_idr'>[];
  return withEstimatedFee(rows);
}

export async function checkoutLibraryItem(input: {
  itemId: number;
  childId: number;
  dueDate: string;
  checkedOutBy: number;
  notes: string | null;
}): Promise<number> {
  const rows = await sql`
    INSERT INTO library_loans (item_id, child_id, due_date, checked_out_by, notes)
    VALUES (${input.itemId}, ${input.childId}, ${input.dueDate}::date, ${input.checkedOutBy}, ${input.notes})
    RETURNING id
  `;
  return rows[0].id as number;
}

/** Marks a loan returned and, if it's late, freezes the fee at today's rate onto the row — see
 * the late_fee_charged_idr comment on the table. Does not invoice anything by itself; an admin
 * still has to click "Charge late fee" (chargeLateFee below), so a fee can be waived first if it
 * shouldn't be billed. */
export async function returnLibraryLoan(loanId: number): Promise<void> {
  const settings = await getLibrarySettings();
  const rows = (await sql`
    UPDATE library_loans SET returned_at = CURRENT_DATE WHERE id = ${loanId} AND returned_at IS NULL
    RETURNING due_date::text, (CURRENT_DATE - due_date)::int AS days_late
  `) as unknown as { due_date: string; days_late: number }[];
  const row = rows[0];
  if (!row) return;
  const fee = calculateLateFee(row.days_late, settings);
  await sql`UPDATE library_loans SET late_fee_charged_idr = ${fee} WHERE id = ${loanId}`;
}

export async function waiveLateFee(loanId: number): Promise<void> {
  await sql`UPDATE library_loans SET late_fee_waived = true WHERE id = ${loanId}`;
}

export class LateFeeError extends Error {}

/** Turns an already-frozen late fee into a real invoice against the borrowing child's family —
 * same invoices/invoice_children/invoice_line_items shape every other invoice on this site uses.
 * late_fee_invoice_id makes this a one-shot action: called again on an already-charged loan, it
 * refuses rather than billing the family twice for the same overdue item. */
export async function chargeLateFee(loanId: number): Promise<number> {
  const rows = (await sql`
    SELECT l.child_id, l.late_fee_charged_idr, l.late_fee_waived, l.late_fee_invoice_id,
      c.parent1_name, c.child_full_name, li.title AS item_title
    FROM library_loans l
    JOIN children c ON c.id = l.child_id
    JOIN library_items li ON li.id = l.item_id
    WHERE l.id = ${loanId}
  `) as unknown as {
    child_id: number;
    late_fee_charged_idr: number | null;
    late_fee_waived: boolean;
    late_fee_invoice_id: number | null;
    parent1_name: string | null;
    child_full_name: string;
    item_title: string;
  }[];
  const loan = rows[0];
  if (!loan) throw new LateFeeError('Loan not found.');
  if (loan.late_fee_invoice_id) throw new LateFeeError('This late fee has already been invoiced.');
  if (loan.late_fee_waived) throw new LateFeeError('This late fee was waived.');
  const amount = loan.late_fee_charged_idr ?? 0;
  if (amount <= 0) throw new LateFeeError('There is no late fee on this loan.');

  const settings = await getLibrarySettings();
  const invoiceNumber = await nextInvoiceNumber();
  const invoiceRows = await sql`
    INSERT INTO invoices (invoice_number, invoice_type, billed_to_name, issue_date, due_date, subtotal_amount, sibling_discount_amount, total_amount)
    VALUES (
      ${invoiceNumber}, 'library', ${loan.parent1_name || loan.child_full_name}, CURRENT_DATE,
      (CURRENT_DATE + (${settings.invoice_due_days} || ' days')::interval)::date,
      ${amount}, 0, ${amount}
    )
    RETURNING id
  `;
  const invoiceId = invoiceRows[0].id as number;
  await sql`
    INSERT INTO invoice_children (invoice_id, child_id, discount_percent, sort_order) VALUES (${invoiceId}, ${loan.child_id}, 0, 0)
  `;
  await sql`
    INSERT INTO invoice_line_items (invoice_id, child_id, description, quantity, unit_price, line_total, sort_order)
    VALUES (${invoiceId}, ${loan.child_id}, ${`Library late fee – ${loan.item_title} (${loan.child_full_name})`}, 1, ${amount}, ${amount}, 0)
  `;
  await sql`UPDATE library_loans SET late_fee_invoice_id = ${invoiceId} WHERE id = ${loanId}`;
  return invoiceId;
}

export interface LibraryItemRow {
  id: number;
  item_type: 'book' | 'toy' | 'sports_equipment';
  title: string;
  author: string | null;
  category: string | null;
  item_code: string | null;
  description: string | null;
  photo_url: string | null;
  total_copies: number;
  is_active: boolean;
  copies_out: number;
}

export async function getLibraryItems(): Promise<LibraryItemRow[]> {
  return (await sql`
    SELECT li.*, COALESCE((
      SELECT count(*) FROM library_loans l WHERE l.item_id = li.id AND l.returned_at IS NULL
    ), 0)::int AS copies_out
    FROM library_items li
    ORDER BY li.item_type, li.title
  `) as unknown as LibraryItemRow[];
}
