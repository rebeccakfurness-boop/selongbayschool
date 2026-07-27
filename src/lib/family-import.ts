/**
 * Shared parsing + import logic for "Student_Enrollment_and_Forcast_2026 - 2027.xlsx", used by
 * both scripts/import-family-tracker.ts (CLI, local file path) and
 * /api/admin/import-family (browser upload, in-memory buffer) — kept in one place so the two
 * never drift apart.
 *
 * Source mapping (confirmed against the real file, not guessed):
 * - "Sheet1" is the real current roster and is what actually populates `children` — "Family
 *   Tracker" is mostly empty in the source file and only defines the canonical column set.
 * - "School Tours" / "Inquiries from WA" / "Old Inquiries" / "Other islanders" / "Visitors only"
 *   are unified into `admissions_enquiries`, tagged by source. "Visitors only" mixes real
 *   prospective-family visits with unrelated visits (teacher applicants, first aid training) —
 *   imported as-is since there's no reliable way to tell them apart programmatically; review and
 *   archive irrelevant rows after import.
 * - "Student Count" populates `class_forecast_entries`. Its "Status" column (Scholarship/Unknown/
 *   Temporary/etc.) is only written on the first row of each run and left blank below it in the
 *   original spreadsheet, so this forward-fills it down until the next label or a Sub
 *   Total/Total row.
 * - "Dashboard" and "July 2025" are not imported: Dashboard is pure derived output (recomputed
 *   live from `children`/`admissions_enquiries` by the app), and July 2025 was confirmed out of
 *   scope (age-cohort list with no contact info).
 */
import * as XLSX from 'xlsx';
import { sql } from './db';
import { classBandFromLabel, type ClassBand } from './family-data';

function cell(sheet: XLSX.WorkSheet, row: number, col: number): unknown {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  return sheet[addr]?.v ?? null;
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/ /g, ' ').trim();
  return s.length ? s : null;
}

/** The sheet stores real dates as Excel serial numbers (via cellDates below they arrive as Date
 * objects) but a handful of rows have hand-typed strings like "10.02.2026" or "30.03.2026" or
 * free text ("Start 6 April") — those are left as null rather than mis-parsed. */
function dateStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = str(value);
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

export interface ParsedChild {
  child_full_name: string;
  child_nickname: string | null;
  class_name: string | null;
  class_band: ClassBand | null;
  dob: string | null;
  parent1_name: string | null;
  parent1_relationship: string | null;
  parent2_name: string | null;
  parent2_relationship: string | null;
  nationality: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  duration_of_stay_note: string | null;
  enrolment_date: string | null;
  exit_date: string | null;
  allergies_medical_notes: string | null;
}

function parseSheet1(wb: XLSX.WorkBook): ParsedChild[] {
  const ws = wb.Sheets['Sheet1'];
  if (!ws) return [];
  const out: ParsedChild[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = 4; r <= range.e.r + 1; r++) {
    const fullName = str(cell(ws, r, 2));
    if (!fullName) continue;
    const className = str(cell(ws, r, 4));
    const fatherPhone = str(cell(ws, r, 7));
    const motherPhone = str(cell(ws, r, 9));
    out.push({
      child_full_name: fullName,
      child_nickname: str(cell(ws, r, 3)),
      class_name: className,
      class_band: classBandFromLabel(className),
      dob: dateStr(cell(ws, r, 5)),
      parent1_name: str(cell(ws, r, 6)),
      parent1_relationship: str(cell(ws, r, 6)) ? 'Father' : null,
      parent2_name: str(cell(ws, r, 8)),
      parent2_relationship: str(cell(ws, r, 8)) ? 'Mother' : null,
      nationality: str(cell(ws, r, 10)),
      primary_contact_email: str(cell(ws, r, 11)),
      primary_contact_phone: fatherPhone || motherPhone,
      duration_of_stay_note: str(cell(ws, r, 12)),
      enrolment_date: dateStr(cell(ws, r, 13)),
      exit_date: dateStr(cell(ws, r, 14)),
      allergies_medical_notes: str(cell(ws, r, 15)),
    });
  }
  return out;
}

export interface ParsedEnquiry {
  source: string;
  parent_name: string | null;
  child_name: string | null;
  child_age: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  plan_to_stay: string | null;
  first_message_date: string | null;
  visit_date: string | null;
  booking_date: string | null;
  booking_time: string | null;
  follow_up_notes: string | null;
}

function parseSchoolTours(wb: XLSX.WorkBook): ParsedEnquiry[] {
  const ws = wb.Sheets['School Tours'];
  if (!ws) return [];
  const out: ParsedEnquiry[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = 3; r <= range.e.r + 1; r++) {
    const parentName = str(cell(ws, r, 2));
    const childName = str(cell(ws, r, 3));
    if (!parentName && !childName) continue;
    out.push({
      source: 'school_tour',
      parent_name: parentName,
      child_name: childName,
      child_age: null,
      contact_phone: str(cell(ws, r, 4)),
      contact_email: str(cell(ws, r, 5)),
      plan_to_stay: null,
      first_message_date: dateStr(cell(ws, r, 6)),
      visit_date: null,
      booking_date: dateStr(cell(ws, r, 7)),
      booking_time: str(cell(ws, r, 8)),
      follow_up_notes: str(cell(ws, r, 9)),
    });
  }
  return out;
}

function parseVisitorsOnly(wb: XLSX.WorkBook): ParsedEnquiry[] {
  const ws = wb.Sheets['Visitors only'];
  if (!ws) return [];
  const out: ParsedEnquiry[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = 4; r <= range.e.r + 1; r++) {
    const name = str(cell(ws, r, 2));
    if (!name) continue;
    out.push({
      source: 'visitor',
      parent_name: name,
      child_name: null,
      child_age: null,
      contact_phone: str(cell(ws, r, 4)),
      contact_email: null,
      plan_to_stay: null,
      first_message_date: null,
      visit_date: dateStr(cell(ws, r, 5)),
      booking_date: null,
      booking_time: null,
      follow_up_notes: [str(cell(ws, r, 3)), str(cell(ws, r, 6))].filter(Boolean).join(' — ') || null,
    });
  }
  return out;
}

function parseInquiriesFromWA(wb: XLSX.WorkBook): ParsedEnquiry[] {
  const ws = wb.Sheets['Inquiries from WA'];
  if (!ws) return [];
  const out: ParsedEnquiry[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = 2; r <= range.e.r + 1; r++) {
    const parentName = str(cell(ws, r, 2));
    const childName = str(cell(ws, r, 3));
    if (!parentName && !childName) continue;
    out.push({
      source: 'whatsapp',
      parent_name: parentName,
      child_name: childName,
      child_age: str(cell(ws, r, 4)),
      contact_phone: str(cell(ws, r, 5)),
      contact_email: str(cell(ws, r, 6)),
      plan_to_stay: str(cell(ws, r, 7)),
      first_message_date: dateStr(cell(ws, r, 8)),
      visit_date: null,
      booking_date: null,
      booking_time: null,
      follow_up_notes: str(cell(ws, r, 9)),
    });
  }
  return out;
}

function parseOldInquiries(wb: XLSX.WorkBook): ParsedEnquiry[] {
  const ws = wb.Sheets['Old Inquiries'];
  if (!ws) return [];
  const out: ParsedEnquiry[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = 2; r <= range.e.r + 1; r++) {
    const parentName = str(cell(ws, r, 1));
    const childName = str(cell(ws, r, 2));
    if (!parentName && !childName) continue;
    out.push({
      source: 'old_inquiry',
      parent_name: parentName,
      child_name: childName,
      child_age: null,
      contact_phone: str(cell(ws, r, 6)),
      contact_email: null,
      plan_to_stay: null,
      first_message_date: dateStr(cell(ws, r, 3)),
      visit_date: null,
      booking_date: null,
      booking_time: null,
      follow_up_notes: [str(cell(ws, r, 4)), str(cell(ws, r, 5))].filter(Boolean).join(' — ') || null,
    });
  }
  return out;
}

function parseOtherIslanders(wb: XLSX.WorkBook): ParsedEnquiry[] {
  const ws = wb.Sheets['Other islanders'];
  if (!ws) return [];
  const out: ParsedEnquiry[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let r = 2; r <= range.e.r + 1; r++) {
    const parentName = str(cell(ws, r, 1));
    const childName = str(cell(ws, r, 2));
    if (!parentName && !childName) continue;
    out.push({
      source: 'other_islander',
      parent_name: parentName,
      child_name: childName,
      child_age: null,
      contact_phone: null,
      contact_email: null,
      plan_to_stay: null,
      first_message_date: dateStr(cell(ws, r, 3)),
      visit_date: null,
      booking_date: null,
      booking_time: null,
      follow_up_notes: str(cell(ws, r, 4)),
    });
  }
  return out;
}

export interface ParsedForecastEntry {
  forecast_month: string;
  class_band: ClassBand;
  child_display_name: string;
  age_or_grade_label: string | null;
  status_tag: string | null;
}

/** Each month block is 3 columns per class band (name, age/grade, count) with one blank spacer
 * column between Secondary and the next month. Column starts confirmed against the real sheet. */
const FORECAST_MONTH_BLOCKS: { month: string; startCol: number }[] = [
  { month: 'July 2026', startCol: 2 },
  { month: 'Aug 2026', startCol: 16 },
  { month: 'Sept 2026', startCol: 30 },
];
const FORECAST_BAND_OFFSETS: { band: ClassBand; offset: number }[] = [
  { band: 'early_years', offset: 1 },
  { band: 'kindergarten', offset: 4 },
  { band: 'primary', offset: 7 },
  { band: 'secondary', offset: 10 },
];

function parseStudentCount(wb: XLSX.WorkBook): ParsedForecastEntry[] {
  const ws = wb.Sheets['Student Count'];
  if (!ws) return [];
  const out: ParsedForecastEntry[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');

  for (const { month, startCol } of FORECAST_MONTH_BLOCKS) {
    let currentTag: string | null = null;
    for (let r = 4; r <= range.e.r + 1; r++) {
      const rowLabel = str(cell(ws, r, 2));
      if (rowLabel && /sub total|paying students|total students/i.test(rowLabel)) {
        currentTag = null;
        continue;
      }
      if (rowLabel) currentTag = rowLabel;

      for (const { band, offset } of FORECAST_BAND_OFFSETS) {
        const nameCol = startCol + offset;
        const name = str(cell(ws, r, nameCol));
        if (!name) continue;
        out.push({
          forecast_month: month,
          class_band: band,
          child_display_name: name,
          age_or_grade_label: str(cell(ws, r, nameCol + 1)),
          status_tag: currentTag,
        });
      }
    }
  }
  return out;
}

export interface ParsedFamilyData {
  children: ParsedChild[];
  enquiries: ParsedEnquiry[];
  forecast: ParsedForecastEntry[];
}

export function parseFamilyWorkbook(wb: XLSX.WorkBook): ParsedFamilyData {
  return {
    children: parseSheet1(wb),
    enquiries: [
      ...parseSchoolTours(wb),
      ...parseVisitorsOnly(wb),
      ...parseInquiriesFromWA(wb),
      ...parseOldInquiries(wb),
      ...parseOtherIslanders(wb),
    ],
    forecast: parseStudentCount(wb),
  };
}

export interface ImportSummary {
  childrenParsed: number;
  childrenInserted: number;
  enquiriesInserted: number;
  forecastInserted: number;
  enquiriesBySource: Record<string, number>;
}

/** Writes parsed data to the database. Safe to re-run for `children` (matched by name + DOB,
 * never duplicates) and `class_forecast_entries` (wiped and fully reinserted every run, cheap to
 * regenerate) — but `admissions_enquiries` has no stable ID in the source sheets to de-duplicate
 * against, so `clearExistingEnquiries` should be set on any run after the first. */
export async function runFamilyImport(
  data: ParsedFamilyData,
  { clearExistingEnquiries = false }: { clearExistingEnquiries?: boolean } = {}
): Promise<ImportSummary> {
  let childrenInserted = 0;
  for (const c of data.children) {
    const existing = await sql`
      SELECT id FROM children WHERE child_full_name = ${c.child_full_name} AND (dob = ${c.dob}::date OR (dob IS NULL AND ${c.dob}::date IS NULL))
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO children (
        child_full_name, child_nickname, class_name, class_band, dob,
        parent1_name, parent1_relationship, parent2_name, parent2_relationship,
        nationality, primary_contact_email, primary_contact_phone, duration_of_stay_note,
        enrolment_date, exit_date, allergies_medical_notes, status, is_active
      ) VALUES (
        ${c.child_full_name}, ${c.child_nickname}, ${c.class_name}, ${c.class_band}, ${c.dob}::date,
        ${c.parent1_name}, ${c.parent1_relationship}, ${c.parent2_name}, ${c.parent2_relationship},
        ${c.nationality}, ${c.primary_contact_email}, ${c.primary_contact_phone}, ${c.duration_of_stay_note},
        ${c.enrolment_date}::date, ${c.exit_date}::date, ${c.allergies_medical_notes}, 'full_time',
        ${!c.exit_date}
      )
    `;
    childrenInserted++;
  }

  if (clearExistingEnquiries) {
    await sql`DELETE FROM admissions_enquiries`;
  }
  let enquiriesInserted = 0;
  const enquiriesBySource: Record<string, number> = {};
  for (const e of data.enquiries) {
    await sql`
      INSERT INTO admissions_enquiries (
        source, parent_name, child_name, child_age, contact_phone, contact_email,
        plan_to_stay, first_message_date, visit_date, booking_date, booking_time, follow_up_notes
      ) VALUES (
        ${e.source}, ${e.parent_name}, ${e.child_name}, ${e.child_age}, ${e.contact_phone}, ${e.contact_email},
        ${e.plan_to_stay}, ${e.first_message_date}::date, ${e.visit_date}::date, ${e.booking_date}::date,
        ${e.booking_time}, ${e.follow_up_notes}
      )
    `;
    enquiriesInserted++;
    enquiriesBySource[e.source] = (enquiriesBySource[e.source] || 0) + 1;
  }

  await sql`DELETE FROM class_forecast_entries`;
  for (const f of data.forecast) {
    await sql`
      INSERT INTO class_forecast_entries (forecast_month, class_band, child_display_name, age_or_grade_label, status_tag)
      VALUES (${f.forecast_month}, ${f.class_band}, ${f.child_display_name}, ${f.age_or_grade_label}, ${f.status_tag})
    `;
  }

  return {
    childrenParsed: data.children.length,
    childrenInserted,
    enquiriesInserted,
    forecastInserted: data.forecast.length,
    enquiriesBySource,
  };
}
