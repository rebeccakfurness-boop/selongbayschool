import * as XLSX from 'xlsx';
import { sql } from './db';
import { parseTagsInput } from './library';

/** One row of a Libib CSV export ("Export Library" in Libib settings) — only the columns this
 * import actually uses; Libib's export has many more (price, notes, review, ...) that don't map
 * to anything on library_items and are ignored. */
interface LibibRow {
  item_type?: string;
  title?: string;
  creators?: string;
  collection?: string;
  ean_isbn13?: string | number;
  upc_isbn10?: string | number;
  description?: string;
  age_group?: string;
  tags?: string;
  copies?: string | number;
}

export interface ParsedLibraryImportItem {
  itemType: 'book' | 'toy' | 'other';
  title: string;
  author: string | null;
  category: string | null;
  itemCode: string | null;
  description: string | null;
  ageGroup: string | null;
  tags: string[];
  totalCopies: number;
}

function cleanText(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

/** Libib's own collection names are prefixed with the school name (e.g. "Selong Bay School -
 * Pre-School") since one Libib account can hold several libraries -- stripped down to just the
 * meaningful part ("Pre-School") for our category field, which is already school-scoped by
 * definition. */
function cleanCategory(collection: unknown): string | null {
  const s = cleanText(collection);
  if (!s) return null;
  return s.replace(/^selong bay school\s*-\s*/i, '').trim() || s;
}

/** SheetJS parses a numeric-looking CSV cell as a JS number, which silently drops any leading
 * zero (Libib's own export had at least one ISBN-10 stored that way: "0007951787" -> 7951787).
 * ISBN-13 always starts with 978/979 so this never bites it, but ISBN-10 needs the leading-zero
 * case treated as unrecoverable -- rejecting anything that isn't exactly 10 characters also
 * catches garbage values Libib's own export had in this column for non-book items (a puzzle
 * piece count, "23", turned up in one row). Better no item_code than a wrong one. */
function cleanIsbn10(value: unknown): string | null {
  const s = cleanText(value);
  if (!s) return null;
  const stripped = s.replace(/[-\s]/g, '');
  return /^\d{9}[\dXx]$/.test(stripped) ? stripped : null;
}

function mapItemType(raw: unknown): 'book' | 'toy' | 'other' {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'book') return 'book';
  if (s === 'boardgame' || s === 'game' || s === 'toy') return 'toy';
  return 'other';
}

/** Parses a Libib CSV export into rows ready to insert. Reads the raw workbook (SheetJS parses
 * CSV the same way it parses .xlsx -- see /api/admin/library/import) rather than splitting text
 * on commas by hand, since several Libib fields (descriptions especially) contain embedded commas
 * and line breaks that only a real CSV/quoting-aware parser handles correctly. */
export function parseLibibWorkbook(wb: XLSX.WorkBook): ParsedLibraryImportItem[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json<LibibRow>(ws, { defval: null });

  const items: ParsedLibraryImportItem[] = [];
  for (const row of rows) {
    const title = cleanText(row.title);
    if (!title) continue;

    const isbn13 = cleanText(row.ean_isbn13);
    const isbn10 = cleanIsbn10(row.upc_isbn10);
    const copies = Number(row.copies);

    items.push({
      itemType: mapItemType(row.item_type),
      title,
      author: cleanText(row.creators),
      category: cleanCategory(row.collection),
      itemCode: isbn13 || isbn10 || null,
      description: cleanText(row.description),
      ageGroup: cleanText(row.age_group),
      tags: parseTagsInput(row.tags ?? null),
      totalCopies: Number.isInteger(copies) && copies > 0 ? copies : 1,
    });
  }
  return items;
}

export interface LibraryImportSummary {
  parsed: number;
  inserted: number;
  skippedDuplicates: number;
}

/** Inserts parsed rows, skipping anything that already looks like it's in the catalogue -- same
 * ISBN if both have one, otherwise the same title within the same category -- so re-uploading a
 * Libib export (or uploading an updated one that overlaps an earlier import) never duplicates the
 * catalogue. Sequential inserts, same non-transactional style as every other import in this app;
 * at this volume (a library export, not a live transactional stream) that's not a real risk. */
export async function runLibraryImport(items: ParsedLibraryImportItem[]): Promise<LibraryImportSummary> {
  let inserted = 0;
  let skippedDuplicates = 0;

  for (const item of items) {
    const existing = item.itemCode
      ? await sql`SELECT id FROM library_items WHERE item_code = ${item.itemCode}`
      : await sql`SELECT id FROM library_items WHERE lower(title) = ${item.title.toLowerCase()} AND category IS NOT DISTINCT FROM ${item.category}`;

    if (existing.length > 0) {
      skippedDuplicates++;
      continue;
    }

    await sql`
      INSERT INTO library_items (item_type, title, author, category, item_code, description, age_group, tags, total_copies)
      VALUES (
        ${item.itemType}, ${item.title}, ${item.author}, ${item.category}, ${item.itemCode}, ${item.description},
        ${item.ageGroup}, ${item.tags}, ${item.totalCopies}
      )
    `;
    inserted++;
  }

  return { parsed: items.length, inserted, skippedDuplicates };
}
