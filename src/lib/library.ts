import { sql } from './db';
import { formatDate } from './admin-format';
import { sendLibraryDueSoonEmail, sendLibraryReservationReadyEmail } from './email';

/** Shared by the add/edit item forms and the CSV importer -- a comma-separated tags string (or
 * an already-split array) into a clean, deduplicated list. Casing is preserved as typed since
 * these are meant to read naturally as filter chips, not normalized into a fixed vocabulary. */
export function parseTagsInput(value: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(value) ? value : (value ?? '').split(',');
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const entry of raw) {
    const tag = String(entry).trim();
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}

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
  item_type: 'book' | 'toy' | 'sports_equipment' | 'other';
  child_id: number;
  child_full_name: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  late_fee_charged_idr: number | null;
  late_fee_waived: boolean;
  late_fee_invoice_id: number | null;
  due_soon_email_sent: boolean;
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
      l.late_fee_charged_idr, l.late_fee_waived, l.late_fee_invoice_id, l.due_soon_email_sent,
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
      l.late_fee_charged_idr, l.late_fee_waived, l.late_fee_invoice_id, l.due_soon_email_sent,
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
    RETURNING item_id, due_date::text, (CURRENT_DATE - due_date)::int AS days_late
  `) as unknown as { item_id: number; due_date: string; days_late: number }[];
  const row = rows[0];
  if (!row) return;
  const fee = calculateLateFee(row.days_late, settings);
  await sql`UPDATE library_loans SET late_fee_charged_idr = ${fee} WHERE id = ${loanId}`;
  await promoteNextWaitlisted(row.item_id);
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
  item_type: 'book' | 'toy' | 'sports_equipment' | 'other';
  title: string;
  author: string | null;
  category: string | null;
  item_code: string | null;
  description: string | null;
  photo_url: string | null;
  age_group: string | null;
  tags: string[];
  school_only: boolean;
  total_copies: number;
  is_active: boolean;
  copies_out: number;
  copies_held: number;
  available_copies: number;
}

/** copies_held counts 'pending_pickup' reservations -- a copy someone's already been told is
 * ready for them at the desk is not available for anyone else to check out or reserve, even
 * though it hasn't been handed over yet (see createLibraryReservation/fulfillLibraryReservation).
 * available_copies is what every checkout/reserve decision should gate on, never total_copies or
 * copies_out alone. */
/** `q` matches title/author/category/age_group/tags (case-insensitive substring); `type` matches
 * item_type exactly. Both optional and combinable -- used by the admin catalogue's own search
 * bar, a plain GET form (see /admin/library) rather than a client component, so the filter is
 * just whatever's in the URL and needs no JS to work. */
export async function getLibraryItems(filter?: { q?: string; type?: string }): Promise<LibraryItemRow[]> {
  const q = filter?.q?.trim() ? `%${filter.q.trim()}%` : null;
  const type = filter?.type?.trim() || null;
  return (await sql`
    SELECT li.*,
      COALESCE((SELECT count(*) FROM library_loans l WHERE l.item_id = li.id AND l.returned_at IS NULL), 0)::int AS copies_out,
      COALESCE((SELECT count(*) FROM library_reservations r WHERE r.item_id = li.id AND r.status = 'pending_pickup'), 0)::int AS copies_held,
      (li.total_copies
        - COALESCE((SELECT count(*) FROM library_loans l WHERE l.item_id = li.id AND l.returned_at IS NULL), 0)
        - COALESCE((SELECT count(*) FROM library_reservations r WHERE r.item_id = li.id AND r.status = 'pending_pickup'), 0)
      )::int AS available_copies
    FROM library_items li
    WHERE (${q}::text IS NULL OR li.title ILIKE ${q} OR li.author ILIKE ${q} OR li.category ILIKE ${q}
      OR li.age_group ILIKE ${q} OR array_to_string(li.tags, ' ') ILIKE ${q})
      AND (${type}::text IS NULL OR li.item_type = ${type})
    ORDER BY li.item_type, li.title
  `) as unknown as LibraryItemRow[];
}

/** Same shape as getLibraryItems, but only active items with title/author/category included for
 * the parent-facing catalogue browser (/account/library) -- no item_code/description bloat the
 * parent doesn't need to search or filter on beyond what's already shown. */
export interface LibraryBrowseItem {
  id: number;
  item_type: 'book' | 'toy' | 'sports_equipment' | 'other';
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  photo_url: string | null;
  age_group: string | null;
  tags: string[];
  available_copies: number;
  waitlist_count: number;
}

/** school_only items are excluded entirely rather than shown-but-disabled -- this list exists to
 * let a family find something to borrow, and an item that can never leave the school has nothing
 * to offer that view (see the school_only column comment on library_items in db.ts). It's still
 * catalogued and searchable from the admin side (getLibraryItems), just not here. */
export async function getBrowsableLibraryItems(): Promise<LibraryBrowseItem[]> {
  return (await sql`
    SELECT li.id, li.item_type, li.title, li.author, li.category, li.description, li.photo_url, li.age_group, li.tags,
      (li.total_copies
        - COALESCE((SELECT count(*) FROM library_loans l WHERE l.item_id = li.id AND l.returned_at IS NULL), 0)
        - COALESCE((SELECT count(*) FROM library_reservations r WHERE r.item_id = li.id AND r.status = 'pending_pickup'), 0)
      )::int AS available_copies,
      COALESCE((SELECT count(*) FROM library_reservations r WHERE r.item_id = li.id AND r.status = 'waitlisted'), 0)::int AS waitlist_count
    FROM library_items li
    WHERE li.is_active = true AND li.school_only = false
    ORDER BY li.item_type, li.title
  `) as unknown as LibraryBrowseItem[];
}

interface LoanReminderRow {
  id: number;
  item_title: string;
  child_full_name: string;
  due_date: string;
  returned_at: string | null;
  primary_contact_email: string | null;
}

/** Loans exactly one day from their due date, still out, and not already reminded — the daily
 * cron's worklist (see /api/cron/library-due-reminders). Excludes anything without an email on
 * file rather than letting sendDueSoonReminderForLoan fail on each one individually. */
export async function getLoansDueTomorrow(): Promise<LoanReminderRow[]> {
  return (await sql`
    SELECT l.id, li.title AS item_title, c.child_full_name, l.due_date::text, l.returned_at::text, c.primary_contact_email
    FROM library_loans l
    JOIN library_items li ON li.id = l.item_id
    JOIN children c ON c.id = l.child_id
    WHERE l.returned_at IS NULL AND l.due_soon_email_sent = false
      AND l.due_date = CURRENT_DATE + 1 AND c.primary_contact_email IS NOT NULL
  `) as unknown as LoanReminderRow[];
}

export class DueSoonReminderError extends Error {}

/** Sends the "due back tomorrow" reminder for one loan and marks it sent — called once per loan
 * by the daily cron, and directly by the admin's manual "Send reminder" button (which isn't
 * limited to loans due tomorrow, or blocked by due_soon_email_sent, since a manual resend should
 * always be possible). Shared here so both call sites stay in sync rather than duplicating the
 * lookup + send + mark-sent sequence. */
export async function sendDueSoonReminderForLoan(loanId: number): Promise<void> {
  const rows = (await sql`
    SELECT l.id, li.title AS item_title, c.child_full_name, l.due_date::text, l.returned_at::text, c.primary_contact_email
    FROM library_loans l
    JOIN library_items li ON li.id = l.item_id
    JOIN children c ON c.id = l.child_id
    WHERE l.id = ${loanId}
  `) as unknown as LoanReminderRow[];
  const loan = rows[0];
  if (!loan) throw new DueSoonReminderError('Loan not found.');
  if (loan.returned_at) throw new DueSoonReminderError('This item has already been returned.');
  if (!loan.primary_contact_email) throw new DueSoonReminderError('No email on file for this family.');

  const sent = await sendLibraryDueSoonEmail({
    toEmail: loan.primary_contact_email,
    childFullName: loan.child_full_name,
    itemTitle: loan.item_title,
    dueDateLabel: formatDate(loan.due_date),
  });
  if (!sent) throw new DueSoonReminderError('The email could not be sent.');

  await sql`UPDATE library_loans SET due_soon_email_sent = true WHERE id = ${loanId}`;
}

export class ReservationError extends Error {}

export interface LibraryReservationRow {
  id: number;
  item_id: number;
  item_title: string;
  item_type: 'book' | 'toy' | 'sports_equipment' | 'other';
  child_id: number;
  child_full_name: string;
  customer_id: number;
  status: 'pending_pickup' | 'waitlisted' | 'fulfilled' | 'cancelled';
  requested_at: string;
  ready_at: string | null;
  queue_position: number | null;
}

/** Whichever waitlisted reservation for this item has been waiting longest gets first claim on a
 * copy that just freed up (a return, or another hold on the same item being cancelled) -- called
 * from returnLibraryLoan and both cancel functions below. Loops rather than promoting just one,
 * since more than one copy can free up at once (e.g. two loans returned together). Best-effort on
 * the email: a failed send still leaves the reservation correctly promoted, just unannounced. */
async function promoteNextWaitlisted(itemId: number): Promise<void> {
  for (;;) {
    const [item] = (await sql`
      SELECT total_copies,
        (SELECT count(*) FROM library_loans l WHERE l.item_id = ${itemId} AND l.returned_at IS NULL) AS copies_out,
        (SELECT count(*) FROM library_reservations r WHERE r.item_id = ${itemId} AND r.status = 'pending_pickup') AS copies_held
      FROM library_items WHERE id = ${itemId}
    `) as unknown as { total_copies: number; copies_out: number; copies_held: number }[];
    if (!item || item.total_copies - item.copies_out - item.copies_held <= 0) return;

    const rows = (await sql`
      UPDATE library_reservations SET status = 'pending_pickup', ready_at = now()
      WHERE id = (
        SELECT id FROM library_reservations
        WHERE item_id = ${itemId} AND status = 'waitlisted'
        ORDER BY requested_at ASC LIMIT 1
      )
      RETURNING id, child_id, customer_id
    `) as unknown as { id: number; child_id: number; customer_id: number }[];
    const promoted = rows[0];
    if (!promoted) return;

    try {
      const [details] = (await sql`
        SELECT li.title AS item_title, c.child_full_name, cu.email AS customer_email
        FROM library_items li, children c, customers cu
        WHERE li.id = ${itemId} AND c.id = ${promoted.child_id} AND cu.id = ${promoted.customer_id}
      `) as unknown as { item_title: string; child_full_name: string; customer_email: string }[];
      if (details) {
        await sendLibraryReservationReadyEmail({
          toEmail: details.customer_email,
          childFullName: details.child_full_name,
          itemTitle: details.item_title,
        });
      }
    } catch (err) {
      console.error('[library] failed to send reservation-ready email', { reservationId: promoted.id, err });
    }
  }
}

/** Parent-initiated hold from the catalogue browser on /account/library — pending_pickup if a
 * copy is free right now, otherwise queued onto the waitlist. Requires an active membership
 * (same rule as borrowing) and refuses a second active hold by the same child on the same item. */
export async function createLibraryReservation(input: { itemId: number; childId: number; customerId: number }): Promise<LibraryReservationRow> {
  const membership = await getMembershipForCustomer(input.customerId);
  if (!membership || membership.status !== 'active') {
    throw new ReservationError('Join the library first, then you can reserve items.');
  }

  const [item] = (await sql`SELECT is_active, school_only FROM library_items WHERE id = ${input.itemId}`) as unknown as {
    is_active: boolean;
    school_only: boolean;
  }[];
  if (!item || !item.is_active) throw new ReservationError('This item is no longer available in the catalogue.');
  if (item.school_only) throw new ReservationError('This item is for use at school only and cannot be borrowed.');

  const existing = await sql`
    SELECT id FROM library_reservations
    WHERE item_id = ${input.itemId} AND child_id = ${input.childId} AND status IN ('pending_pickup', 'waitlisted')
  `;
  if (existing.length > 0) throw new ReservationError('Already reserved or on the waitlist for this item.');

  const [counts] = (await sql`
    SELECT
      (SELECT total_copies FROM library_items WHERE id = ${input.itemId}) AS total_copies,
      (SELECT count(*) FROM library_loans l WHERE l.item_id = ${input.itemId} AND l.returned_at IS NULL) AS copies_out,
      (SELECT count(*) FROM library_reservations r WHERE r.item_id = ${input.itemId} AND r.status = 'pending_pickup') AS copies_held
  `) as unknown as { total_copies: number; copies_out: number; copies_held: number }[];
  const available = counts.total_copies - counts.copies_out - counts.copies_held;
  const status = available > 0 ? 'pending_pickup' : 'waitlisted';

  const readyAt = status === 'pending_pickup' ? new Date() : null;
  const rows = await sql`
    INSERT INTO library_reservations (item_id, child_id, customer_id, status, ready_at)
    VALUES (${input.itemId}, ${input.childId}, ${input.customerId}, ${status}, ${readyAt})
    RETURNING id, item_id, child_id, customer_id, status, requested_at::text, ready_at::text
  `;
  const row = rows[0] as { id: number; item_id: number; child_id: number; customer_id: number; status: string; requested_at: string; ready_at: string | null };

  const [details] = (await sql`
    SELECT li.title AS item_title, li.item_type, c.child_full_name FROM library_items li, children c
    WHERE li.id = ${input.itemId} AND c.id = ${input.childId}
  `) as unknown as { item_title: string; item_type: LibraryReservationRow['item_type']; child_full_name: string }[];

  return {
    id: row.id,
    item_id: row.item_id,
    item_title: details.item_title,
    item_type: details.item_type,
    child_id: row.child_id,
    child_full_name: details.child_full_name,
    customer_id: row.customer_id,
    status: row.status as LibraryReservationRow['status'],
    requested_at: row.requested_at,
    ready_at: row.ready_at,
    queue_position: null,
  };
}

export async function getReservationsForCustomer(customerId: number): Promise<LibraryReservationRow[]> {
  return (await sql`
    SELECT r.id, r.item_id, li.title AS item_title, li.item_type, r.child_id, c.child_full_name, r.customer_id,
      r.status, r.requested_at::text, r.ready_at::text,
      CASE WHEN r.status = 'waitlisted' THEN (
        SELECT count(*) FROM library_reservations r2
        WHERE r2.item_id = r.item_id AND r2.status = 'waitlisted' AND r2.requested_at <= r.requested_at
      ) END AS queue_position
    FROM library_reservations r
    JOIN library_items li ON li.id = r.item_id
    JOIN children c ON c.id = r.child_id
    WHERE r.customer_id = ${customerId} AND r.status IN ('pending_pickup', 'waitlisted')
    ORDER BY r.requested_at ASC
  `) as unknown as LibraryReservationRow[];
}

export interface AdminReservationRow extends LibraryReservationRow {
  customer_name: string | null;
  customer_email: string;
}

export async function getAllReservations(): Promise<AdminReservationRow[]> {
  return (await sql`
    SELECT r.id, r.item_id, li.title AS item_title, li.item_type, r.child_id, c.child_full_name, r.customer_id,
      cu.name AS customer_name, cu.email AS customer_email,
      r.status, r.requested_at::text, r.ready_at::text,
      CASE WHEN r.status = 'waitlisted' THEN (
        SELECT count(*) FROM library_reservations r2
        WHERE r2.item_id = r.item_id AND r2.status = 'waitlisted' AND r2.requested_at <= r.requested_at
      ) END AS queue_position
    FROM library_reservations r
    JOIN library_items li ON li.id = r.item_id
    JOIN children c ON c.id = r.child_id
    JOIN customers cu ON cu.id = r.customer_id
    WHERE r.status IN ('pending_pickup', 'waitlisted')
    ORDER BY r.status, r.requested_at ASC
  `) as unknown as AdminReservationRow[];
}

/** Cancelling frees up whatever this reservation was holding (a pending_pickup copy) or simply
 * removes it from the queue (waitlisted) -- either way, worth an immediate promotion check since
 * a pending_pickup cancellation specifically frees a copy someone else could now take. */
export async function cancelLibraryReservationByCustomer(reservationId: number, customerId: number): Promise<void> {
  const rows = (await sql`
    UPDATE library_reservations SET status = 'cancelled', cancelled_at = now()
    WHERE id = ${reservationId} AND customer_id = ${customerId} AND status IN ('pending_pickup', 'waitlisted')
    RETURNING item_id
  `) as unknown as { item_id: number }[];
  if (rows[0]) await promoteNextWaitlisted(rows[0].item_id);
}

export async function cancelLibraryReservationAdmin(reservationId: number): Promise<void> {
  const rows = (await sql`
    UPDATE library_reservations SET status = 'cancelled', cancelled_at = now()
    WHERE id = ${reservationId} AND status IN ('pending_pickup', 'waitlisted')
    RETURNING item_id
  `) as unknown as { item_id: number }[];
  if (rows[0]) await promoteNextWaitlisted(rows[0].item_id);
}

/** Hands the item over for real — creates the actual loan (same checkoutLibraryItem the admin's
 * ad-hoc "Check out" button uses) and closes out the reservation. Only valid on a pending_pickup
 * reservation; a still-waitlisted one has no copy held for it yet to hand over. */
export async function fulfillLibraryReservation(reservationId: number, checkedOutBy: number): Promise<number> {
  const [reservation] = (await sql`
    SELECT item_id, child_id, status FROM library_reservations WHERE id = ${reservationId}
  `) as unknown as { item_id: number; child_id: number; status: string }[];
  if (!reservation) throw new ReservationError('Reservation not found.');
  if (reservation.status !== 'pending_pickup') throw new ReservationError('This reservation is not ready for pickup yet.');

  const settings = await getLibrarySettings();
  const [{ due }] = (await sql`
    SELECT (CURRENT_DATE + (${settings.default_loan_period_days} || ' days')::interval)::date::text AS due
  `) as unknown as { due: string }[];

  const loanId = await checkoutLibraryItem({ itemId: reservation.item_id, childId: reservation.child_id, dueDate: due, checkedOutBy, notes: null });
  await sql`UPDATE library_reservations SET status = 'fulfilled', fulfilled_loan_id = ${loanId} WHERE id = ${reservationId}`;
  return loanId;
}
