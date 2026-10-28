import { sql } from './db';
import type { UpsertLombokGuideEntryInput } from './validation';

export const CATEGORY_LABELS: Record<string, string> = {
  car_rental: 'Car Rental',
  attraction: 'Local Attractions',
  activity: 'Activities',
  food_shopping: 'Food & Shopping',
  medical: 'Medical Services',
  real_estate: 'Real Estate Agents',
  other: 'Other',
};

/** Display order for category sections -- both the parent-facing guide page and the PDF group
 * entries by category and walk them in this order, not alphabetically, since "what to read first
 * when you're moving here" isn't alphabetical (practical settling-in info before attractions). */
export const CATEGORY_ORDER = ['real_estate', 'medical', 'car_rental', 'food_shopping', 'attraction', 'activity', 'other'];

export interface LombokGuideEntry {
  id: number;
  category: string;
  title: string;
  description: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export async function getActiveGuideEntries(): Promise<LombokGuideEntry[]> {
  return (await sql`
    SELECT id, category, title, description, address, phone, website, is_active, sort_order, created_at::text
    FROM lombok_guide_entries WHERE is_active = true
    ORDER BY category, sort_order, title
  `) as unknown as LombokGuideEntry[];
}

export async function getAllGuideEntries(): Promise<LombokGuideEntry[]> {
  return (await sql`
    SELECT id, category, title, description, address, phone, website, is_active, sort_order, created_at::text
    FROM lombok_guide_entries
    ORDER BY category, sort_order, title
  `) as unknown as LombokGuideEntry[];
}

export async function createGuideEntry(input: UpsertLombokGuideEntryInput, createdByAdminId: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO lombok_guide_entries (category, title, description, address, phone, website, is_active, created_by)
    VALUES (${input.category}, ${input.title}, ${input.description}, ${input.address || null}, ${input.phone || null}, ${input.website || null}, ${input.isActive}, ${createdByAdminId})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function updateGuideEntry(id: number, input: UpsertLombokGuideEntryInput): Promise<void> {
  await sql`
    UPDATE lombok_guide_entries
    SET category = ${input.category}, title = ${input.title}, description = ${input.description},
        address = ${input.address || null}, phone = ${input.phone || null}, website = ${input.website || null}, is_active = ${input.isActive},
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteGuideEntry(id: number): Promise<void> {
  await sql`DELETE FROM lombok_guide_entries WHERE id = ${id}`;
}

/** Groups entries by category in CATEGORY_ORDER, skipping any category with no (active) entries
 * -- shared by the parent-facing page and the PDF so both ever show the same sections. */
export function groupByCategory(entries: LombokGuideEntry[]): { category: string; label: string; entries: LombokGuideEntry[] }[] {
  const byCategory = new Map<string, LombokGuideEntry[]>();
  for (const e of entries) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }
  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({ category: c, label: CATEGORY_LABELS[c], entries: byCategory.get(c)! }));
}
