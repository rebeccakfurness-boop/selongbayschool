import { sql } from './db';
import { countLunchDays, weekdaysSummaryLabel, type LunchWeekdays } from './lunch-calc';
import { formatDate } from './admin-format';

export interface CreateLunchOrderInput {
  childId: number;
  customerId: number;
  billedToName: string;
  startDate: string;
  endDate: string;
  weekdays: LunchWeekdays;
  lunchSize: 'normal' | 'large';
  foodPreference: string | null;
  allergiesNotes: string | null;
  unitPrice: number;
  dueDays: number;
}

export interface CreateLunchOrderResult {
  lunchOrderId: number;
  invoiceId: number;
  invoiceNumber: number;
  lunchCount: number;
  totalAmount: number;
  dueDate: string;
}

/** Writes the invoice (+ its child/line-item rows, same shape admin-created invoices use) and the
 * lunch_orders row together — lunch_count/total are computed once here and stored, not recomputed
 * on read, so a later price change never silently reprices an order already placed. No sibling
 * discount: unlike tuition/activity invoices, a lunch order is always placed one child at a time
 * from that child's own page, so there's no multi-child invoice to discount across. */
export async function createLunchOrder(input: CreateLunchOrderInput): Promise<CreateLunchOrderResult> {
  const lunchCount = countLunchDays(input.startDate, input.endDate, input.weekdays);
  const totalAmount = lunchCount * input.unitPrice;

  const [{ nextval: invoiceNumber }] = (await sql`SELECT nextval('invoice_number_seq') AS nextval`) as unknown as {
    nextval: number;
  }[];

  const description = `Lunches (${input.lunchSize === 'large' ? 'Large' : 'Normal'} size), ${weekdaysSummaryLabel(input.weekdays)}, ${formatDate(input.startDate)} – ${formatDate(input.endDate)}`;

  const invoiceRows = await sql`
    INSERT INTO invoices (invoice_number, invoice_type, billed_to_name, issue_date, due_date, subtotal_amount, sibling_discount_amount, total_amount)
    VALUES (
      ${invoiceNumber}, 'lunch', ${input.billedToName}, CURRENT_DATE,
      (CURRENT_DATE + (${input.dueDays} || ' days')::interval)::date,
      ${totalAmount}, 0, ${totalAmount}
    )
    RETURNING id, due_date::text
  `;
  const invoiceId = invoiceRows[0].id as number;
  const dueDate = invoiceRows[0].due_date as string;

  await sql`
    INSERT INTO invoice_children (invoice_id, child_id, discount_percent, sort_order)
    VALUES (${invoiceId}, ${input.childId}, 0, 0)
  `;
  await sql`
    INSERT INTO invoice_line_items (invoice_id, child_id, description, quantity, unit_price, line_total, sort_order)
    VALUES (${invoiceId}, ${input.childId}, ${description}, ${lunchCount}, ${input.unitPrice}, ${totalAmount}, 0)
  `;

  const orderRows = await sql`
    INSERT INTO lunch_orders (
      child_id, customer_id, own_lunch, start_date, end_date,
      monday, tuesday, wednesday, thursday, friday,
      lunch_size, food_preference, allergies_notes, lunch_count, invoice_id
    )
    VALUES (
      ${input.childId}, ${input.customerId}, false, ${input.startDate}::date, ${input.endDate}::date,
      ${input.weekdays.monday}, ${input.weekdays.tuesday}, ${input.weekdays.wednesday}, ${input.weekdays.thursday}, ${input.weekdays.friday},
      ${input.lunchSize}, ${input.foodPreference}, ${input.allergiesNotes}, ${lunchCount}, ${invoiceId}
    )
    RETURNING id
  `;

  return { lunchOrderId: orderRows[0].id as number, invoiceId, invoiceNumber, lunchCount, totalAmount, dueDate };
}

export async function createOwnLunchRecord(childId: number, customerId: number): Promise<number> {
  const rows = await sql`
    INSERT INTO lunch_orders (child_id, customer_id, own_lunch)
    VALUES (${childId}, ${customerId}, true)
    RETURNING id
  `;
  return rows[0].id as number;
}

export interface LunchOrderSummaryRow {
  id: number;
  own_lunch: boolean;
  start_date: string | null;
  end_date: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  lunch_size: 'normal' | 'large' | null;
  food_preference: string | null;
  allergies_notes: string | null;
  lunch_count: number | null;
  invoice_id: number | null;
  invoice_number: number | null;
  invoice_status: 'outstanding' | 'paid' | 'cancelled' | null;
  invoice_total: number | null;
  created_at: string;
}

export async function getLunchOrdersForChild(childId: number): Promise<LunchOrderSummaryRow[]> {
  return (await sql`
    SELECT lo.id, lo.own_lunch, lo.start_date::text, lo.end_date::text,
      lo.monday, lo.tuesday, lo.wednesday, lo.thursday, lo.friday,
      lo.lunch_size, lo.food_preference, lo.allergies_notes, lo.lunch_count, lo.invoice_id,
      i.invoice_number, i.status AS invoice_status, i.total_amount AS invoice_total,
      lo.created_at::text
    FROM lunch_orders lo
    LEFT JOIN invoices i ON i.id = lo.invoice_id
    WHERE lo.child_id = ${childId}
    ORDER BY lo.created_at DESC
  `) as unknown as LunchOrderSummaryRow[];
}

export interface AdminLunchOrderRow extends LunchOrderSummaryRow {
  child_id: number;
  child_full_name: string;
}

export async function getAllLunchOrders(): Promise<AdminLunchOrderRow[]> {
  return (await sql`
    SELECT lo.id, lo.own_lunch, lo.start_date::text, lo.end_date::text,
      lo.monday, lo.tuesday, lo.wednesday, lo.thursday, lo.friday,
      lo.lunch_size, lo.food_preference, lo.allergies_notes, lo.lunch_count, lo.invoice_id,
      i.invoice_number, i.status AS invoice_status, i.total_amount AS invoice_total,
      lo.created_at::text, lo.child_id, c.child_full_name
    FROM lunch_orders lo
    JOIN children c ON c.id = lo.child_id
    LEFT JOIN invoices i ON i.id = lo.invoice_id
    ORDER BY lo.created_at DESC
  `) as unknown as AdminLunchOrderRow[];
}
