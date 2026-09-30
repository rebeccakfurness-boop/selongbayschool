import { sql } from './db';
import type {
  CcaSettingsInput,
  CreateCcaActivityInput,
  UpdateCcaActivityInput,
  SetCcaPriceOverrideInput,
  SubmitCcaSelectionInput,
} from './validation';

export interface CcaSettingsRow {
  id: 1;
  term_label: string;
  term_start_date: string | null;
  term_end_date: string | null;
  selection_open: boolean;
}

export interface CcaOptionRow {
  id: number;
  cca_id: number;
  name: string;
  price_idr: number;
  sort_order: number;
}

export interface CcaActivityRow {
  id: number;
  name: string;
  description: string | null;
  day_of_week: string | null;
  default_price_idr: number;
  min_students: number | null;
  is_active: boolean;
  sort_order: number;
  options: CcaOptionRow[];
}

export interface CcaSelectionItemRow {
  id: number;
  cca_id: number;
  cca_name: string;
  option_id: number | null;
  option_name: string | null;
  price_idr: number;
  excluded_at_invoicing: boolean;
  enrollment_count: number | null;
  min_students: number | null;
}

export interface CcaSelectionRow {
  id: number;
  child_id: number;
  term_label: string;
  status: 'submitted' | 'invoiced';
  total_amount_idr: number;
  invoice_id: number | null;
  items: CcaSelectionItemRow[];
}

// --- settings ---

export async function getCcaSettings(): Promise<CcaSettingsRow> {
  const rows = (await sql`
    SELECT id, term_label, term_start_date::text, term_end_date::text, selection_open
    FROM cca_settings WHERE id = 1
  `) as unknown as CcaSettingsRow[];
  return rows[0];
}

export async function updateCcaSettings(input: CcaSettingsInput): Promise<void> {
  await sql`
    UPDATE cca_settings SET
      term_label = ${input.termLabel},
      term_start_date = ${input.termStartDate ?? null},
      term_end_date = ${input.termEndDate ?? null},
      selection_open = ${input.selectionOpen},
      updated_at = now()
    WHERE id = 1
  `;
}

// --- catalog ---

async function attachOptions(activities: Omit<CcaActivityRow, 'options'>[]): Promise<CcaActivityRow[]> {
  if (activities.length === 0) return [];
  const ids = activities.map((a) => a.id);
  const options = (await sql`
    SELECT id, cca_id, name, price_idr, sort_order FROM cca_options
    WHERE cca_id = ANY(${ids}) ORDER BY sort_order ASC, id ASC
  `) as unknown as CcaOptionRow[];
  return activities.map((a) => ({ ...a, options: options.filter((o) => o.cca_id === a.id) }));
}

export async function getAllCcaActivitiesForAdmin(): Promise<CcaActivityRow[]> {
  const rows = (await sql`
    SELECT id, name, description, day_of_week, default_price_idr, min_students, is_active, sort_order
    FROM cca_activities ORDER BY sort_order ASC, id ASC
  `) as unknown as Omit<CcaActivityRow, 'options'>[];
  return attachOptions(rows);
}

export async function getActiveCcaActivities(): Promise<CcaActivityRow[]> {
  const rows = (await sql`
    SELECT id, name, description, day_of_week, default_price_idr, min_students, is_active, sort_order
    FROM cca_activities WHERE is_active = true ORDER BY sort_order ASC, id ASC
  `) as unknown as Omit<CcaActivityRow, 'options'>[];
  return attachOptions(rows);
}

export async function createCcaActivity(input: CreateCcaActivityInput): Promise<number> {
  const rows = await sql`
    INSERT INTO cca_activities (name, description, day_of_week, default_price_idr, min_students)
    VALUES (${input.name}, ${input.description || null}, ${input.dayOfWeek || null}, ${input.defaultPriceIDR}, ${input.minStudents ?? null})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateCcaActivity(id: number, input: UpdateCcaActivityInput): Promise<void> {
  if (input.name !== undefined) await sql`UPDATE cca_activities SET name = ${input.name} WHERE id = ${id}`;
  if (input.description !== undefined) await sql`UPDATE cca_activities SET description = ${input.description} WHERE id = ${id}`;
  if (input.dayOfWeek !== undefined) await sql`UPDATE cca_activities SET day_of_week = ${input.dayOfWeek} WHERE id = ${id}`;
  if (input.defaultPriceIDR !== undefined) await sql`UPDATE cca_activities SET default_price_idr = ${input.defaultPriceIDR} WHERE id = ${id}`;
  if (input.minStudents !== undefined) await sql`UPDATE cca_activities SET min_students = ${input.minStudents} WHERE id = ${id}`;
  if (input.isActive !== undefined) await sql`UPDATE cca_activities SET is_active = ${input.isActive} WHERE id = ${id}`;
  if (input.sortOrder !== undefined) await sql`UPDATE cca_activities SET sort_order = ${input.sortOrder} WHERE id = ${id}`;
}

/** Guarded delete: a CCA that any parent has already selected (even under a past term) can't be
 * removed outright, or their selection history would silently lose its meaning -- same guard
 * shape as the activities/sessions "Remove" button, which only shows when booking_count === 0. */
export async function deleteCcaActivity(id: number): Promise<{ ok: true } | { ok: false; reason: 'in_use' }> {
  const inUse = await sql`SELECT 1 FROM cca_selection_items WHERE cca_id = ${id} LIMIT 1`;
  if (inUse.length > 0) return { ok: false, reason: 'in_use' };
  await sql`DELETE FROM cca_activities WHERE id = ${id}`;
  return { ok: true };
}

export async function addCcaOption(ccaId: number, input: { name: string; priceIDR: number }): Promise<number> {
  const rows = await sql`
    INSERT INTO cca_options (cca_id, name, price_idr) VALUES (${ccaId}, ${input.name}, ${input.priceIDR})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateCcaOption(id: number, input: Partial<{ name: string; priceIDR: number }>): Promise<void> {
  if (input.name !== undefined) await sql`UPDATE cca_options SET name = ${input.name} WHERE id = ${id}`;
  if (input.priceIDR !== undefined) await sql`UPDATE cca_options SET price_idr = ${input.priceIDR} WHERE id = ${id}`;
}

export async function deleteCcaOption(id: number): Promise<void> {
  await sql`DELETE FROM cca_options WHERE id = ${id}`;
}

// --- price overrides (admin, per child) ---

export interface CcaPriceOverrideRow {
  id: number;
  cca_id: number;
  cca_name: string;
  price_idr: number;
}

export async function getCcaPriceOverridesForChild(childId: number): Promise<CcaPriceOverrideRow[]> {
  return (await sql`
    SELECT po.id, po.cca_id, ca.name AS cca_name, po.price_idr
    FROM cca_price_overrides po JOIN cca_activities ca ON ca.id = po.cca_id
    WHERE po.child_id = ${childId} ORDER BY ca.name
  `) as unknown as CcaPriceOverrideRow[];
}

export async function setCcaPriceOverride(input: SetCcaPriceOverrideInput, adminUserId: number): Promise<void> {
  await sql`
    INSERT INTO cca_price_overrides (cca_id, child_id, price_idr, created_by)
    VALUES (${input.ccaId}, ${input.childId}, ${input.priceIDR}, ${adminUserId})
    ON CONFLICT (cca_id, child_id) DO UPDATE SET price_idr = excluded.price_idr, created_by = excluded.created_by, created_at = now()
  `;
}

export async function removeCcaPriceOverride(id: number): Promise<void> {
  await sql`DELETE FROM cca_price_overrides WHERE id = ${id}`;
}

// --- pure pricing ---

export function resolvePrice(
  activityDefaultPriceIdr: number,
  optionPriceIdr: number | null,
  overridePriceIdr: number | null
): number {
  if (overridePriceIdr != null) return overridePriceIdr;
  return optionPriceIdr != null ? optionPriceIdr : activityDefaultPriceIdr;
}

// --- parent selection ---

async function loadSelectionItems(selectionId: number): Promise<CcaSelectionItemRow[]> {
  return (await sql`
    SELECT csi.id, csi.cca_id, ca.name AS cca_name, csi.option_id, co.name AS option_name,
      csi.price_idr, csi.excluded_at_invoicing, ca.min_students
    FROM cca_selection_items csi
    JOIN cca_activities ca ON ca.id = csi.cca_id
    LEFT JOIN cca_options co ON co.id = csi.option_id
    WHERE csi.selection_id = ${selectionId}
    ORDER BY ca.sort_order ASC, ca.id ASC
  `) as unknown as CcaSelectionItemRow[];
}

export async function getCcaSelectionForChild(childId: number, termLabel: string): Promise<CcaSelectionRow | null> {
  const rows = (await sql`
    SELECT id, child_id, term_label, status, total_amount_idr, invoice_id
    FROM cca_selections WHERE child_id = ${childId} AND term_label = ${termLabel}
  `) as unknown as Omit<CcaSelectionRow, 'items'>[];
  const selection = rows[0];
  if (!selection) return null;
  return { ...selection, items: await loadSelectionItems(selection.id) };
}

export type SubmitCcaSelectionResult =
  | { selectionId: number; totalAmountIdr: number }
  | { error: 'locked' | 'selection_closed' | 'invalid_item' };

/** Resolves every item's price server-side (never trusts a client-sent price) and replaces any
 * existing 'submitted' row's items wholesale -- no autosave/draft rows, nothing persists until
 * this is called. Rejects if an 'invoiced' row already exists for this child/term (locked). */
export async function submitCcaSelection(
  childId: number,
  termLabel: string,
  items: SubmitCcaSelectionInput['items']
): Promise<SubmitCcaSelectionResult> {
  const settings = await getCcaSettings();
  if (!settings.selection_open || settings.term_label !== termLabel) {
    return { error: 'selection_closed' };
  }

  const existing = (await sql`
    SELECT id, status FROM cca_selections WHERE child_id = ${childId} AND term_label = ${termLabel}
  `) as unknown as { id: number; status: string }[];
  if (existing[0]?.status === 'invoiced') {
    return { error: 'locked' };
  }

  // Postgres BIGSERIAL columns (cca_activities.id, cca_options.id, ...) come back from this
  // driver as strings, not numbers -- Number(...) here so activityById/option lookups below
  // compare cleanly against item.ccaId/item.optionId, which zod has already coerced to real
  // numbers (see submitCcaSelectionSchema). Without this, `o.id === item.optionId` is always
  // false (string !== number) and every submission fails as 'invalid_item'.
  const activities = await getActiveCcaActivities();
  const activityById = new Map(activities.map((a) => [Number(a.id), a]));

  let total = 0;
  const resolvedItems: { ccaId: number; optionId: number | null; priceIdr: number }[] = [];
  for (const item of items) {
    const activity = activityById.get(item.ccaId);
    if (!activity) return { error: 'invalid_item' };
    let option: CcaOptionRow | null = null;
    if (activity.options.length > 0) {
      if (item.optionId == null) return { error: 'invalid_item' };
      option = activity.options.find((o) => Number(o.id) === item.optionId) ?? null;
      if (!option) return { error: 'invalid_item' };
    }
    const override = (await sql`
      SELECT price_idr FROM cca_price_overrides WHERE cca_id = ${item.ccaId} AND child_id = ${childId}
    `) as unknown as { price_idr: number }[];
    const priceIdr = resolvePrice(activity.default_price_idr, option?.price_idr ?? null, override[0]?.price_idr ?? null);
    total += priceIdr;
    resolvedItems.push({ ccaId: item.ccaId, optionId: option?.id ?? null, priceIdr });
  }

  let selectionId: number;
  if (existing[0]) {
    selectionId = existing[0].id;
    await sql`UPDATE cca_selections SET total_amount_idr = ${total}, submitted_at = now(), updated_at = now() WHERE id = ${selectionId}`;
    await sql`DELETE FROM cca_selection_items WHERE selection_id = ${selectionId}`;
  } else {
    const rows = await sql`
      INSERT INTO cca_selections (child_id, term_label, total_amount_idr)
      VALUES (${childId}, ${termLabel}, ${total})
      RETURNING id
    `;
    selectionId = rows[0].id as number;
  }

  for (const item of resolvedItems) {
    await sql`
      INSERT INTO cca_selection_items (selection_id, cca_id, option_id, price_idr)
      VALUES (${selectionId}, ${item.ccaId}, ${item.optionId}, ${item.priceIdr})
    `;
  }

  return { selectionId, totalAmountIdr: total };
}

// --- admin review + invoicing ---

/** Live count of non-excluded selections per CCA across the whole term (submitted + invoiced) --
 * not frozen at any point, so it reflects other families' in-progress submissions too. This is a
 * point-in-time judgment call for the admin reviewing one child, matching the "admin manually
 * excludes under-minimum CCAs" design -- there's no automatic gate this count feeds. */
export async function getCcaEnrollmentCounts(termLabel: string): Promise<Map<number, number>> {
  const rows = (await sql`
    SELECT csi.cca_id, COUNT(DISTINCT csi.selection_id)::int AS count
    FROM cca_selection_items csi
    JOIN cca_selections cs ON cs.id = csi.selection_id
    WHERE cs.term_label = ${termLabel} AND csi.excluded_at_invoicing = false
    GROUP BY csi.cca_id
  `) as unknown as { cca_id: number; count: number }[];
  return new Map(rows.map((r) => [r.cca_id, r.count]));
}

export async function getCcaReviewForChild(childId: number, termLabel: string): Promise<CcaSelectionRow | null> {
  const selection = await getCcaSelectionForChild(childId, termLabel);
  if (!selection) return null;
  const counts = await getCcaEnrollmentCounts(termLabel);
  return { ...selection, items: selection.items.map((item) => ({ ...item, enrollment_count: counts.get(item.cca_id) ?? 0 })) };
}

export async function toggleCcaSelectionItemExcluded(itemId: number, excluded: boolean): Promise<void> {
  await sql`UPDATE cca_selection_items SET excluded_at_invoicing = ${excluded} WHERE id = ${itemId}`;
}

export interface CreateCcaInvoiceResult {
  invoiceId: number;
  invoiceNumber: number;
  totalAmount: number;
  dueDate: string;
}

export type CreateCcaInvoiceOutcome = CreateCcaInvoiceResult | { error: 'already_invoiced' | 'nothing_to_invoice' };

/** Mirrors createLunchOrder's invoice-writing sequence (see lunch-orders.ts), but with one line
 * item per non-excluded cca_selection_item instead of a single lunch-count line. No sibling
 * discount: CCA invoicing is per-child, one selection at a time, same convention as lunch/library
 * invoices -- there's no multi-child invoice to discount across. */
export async function createCcaInvoiceForSelection(
  selectionId: number,
  billedToName: string,
  dueDays: number
): Promise<CreateCcaInvoiceOutcome> {
  const rows = (await sql`
    SELECT id, child_id, status FROM cca_selections WHERE id = ${selectionId}
  `) as unknown as { id: number; child_id: number; status: string }[];
  const selection = rows[0];
  if (!selection) return { error: 'already_invoiced' };
  if (selection.status === 'invoiced') return { error: 'already_invoiced' };

  const items = await loadSelectionItems(selectionId);
  const billableItems = items.filter((i) => !i.excluded_at_invoicing);
  if (billableItems.length === 0) return { error: 'nothing_to_invoice' };

  const totalAmount = billableItems.reduce((sum, i) => sum + i.price_idr, 0);

  const [{ nextval: invoiceNumber }] = (await sql`SELECT nextval('invoice_number_seq') AS nextval`) as unknown as {
    nextval: number;
  }[];

  const invoiceRows = await sql`
    INSERT INTO invoices (invoice_number, invoice_type, billed_to_name, issue_date, due_date, subtotal_amount, sibling_discount_amount, total_amount)
    VALUES (
      ${invoiceNumber}, 'cca', ${billedToName}, CURRENT_DATE,
      (CURRENT_DATE + (${dueDays} || ' days')::interval)::date,
      ${totalAmount}, 0, ${totalAmount}
    )
    RETURNING id, due_date::text
  `;
  const invoiceId = invoiceRows[0].id as number;
  const dueDate = invoiceRows[0].due_date as string;

  await sql`
    INSERT INTO invoice_children (invoice_id, child_id, discount_percent, sort_order)
    VALUES (${invoiceId}, ${selection.child_id}, 0, 0)
  `;

  let sortOrder = 0;
  for (const item of billableItems) {
    const description = item.option_name ? `${item.cca_name} - ${item.option_name}` : item.cca_name;
    await sql`
      INSERT INTO invoice_line_items (invoice_id, child_id, description, quantity, unit_price, line_total, sort_order)
      VALUES (${invoiceId}, ${selection.child_id}, ${description}, 1, ${item.price_idr}, ${item.price_idr}, ${sortOrder})
    `;
    sortOrder++;
  }

  await sql`UPDATE cca_selections SET status = 'invoiced', invoice_id = ${invoiceId}, updated_at = now() WHERE id = ${selectionId}`;

  return { invoiceId, invoiceNumber, totalAmount, dueDate };
}

export interface CcaSelectionAdminRow {
  selection_id: number;
  child_id: number;
  child_full_name: string;
  status: 'submitted' | 'invoiced';
  total_amount_idr: number;
  invoice_id: number | null;
  invoice_number: number | null;
  item_count: number;
}

export async function getAllCcaSelectionsForAdmin(termLabel: string): Promise<CcaSelectionAdminRow[]> {
  return (await sql`
    SELECT cs.id AS selection_id, cs.child_id, c.child_full_name, cs.status, cs.total_amount_idr,
      cs.invoice_id, inv.invoice_number,
      (SELECT COUNT(*)::int FROM cca_selection_items WHERE selection_id = cs.id) AS item_count
    FROM cca_selections cs
    JOIN children c ON c.id = cs.child_id
    LEFT JOIN invoices inv ON inv.id = cs.invoice_id
    WHERE cs.term_label = ${termLabel}
    ORDER BY c.child_full_name
  `) as unknown as CcaSelectionAdminRow[];
}
