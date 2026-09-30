import { sql } from './db';
import { ACTIVE_STATUSES } from './child-lifecycle-shared';

/** Board-facing operations metrics -- deliberately separate from budget.ts (budget-shared.ts is
 * about money; this is everything else on the platform a Yayasan board would want a pulse on).
 * Rendered by SchoolReportDocument.tsx via the same Pages Router PDF route as the budget reports. */

const ENQUIRY_TYPES = ['contact', 'admissions', 'high_school'] as const;
const ENQUIRY_TYPE_LABELS: Record<string, string> = {
  contact: 'Contact form',
  admissions: 'Admissions enquiry',
  high_school: 'High school enquiry',
};

const ADMISSIONS_SOURCES = ['school_tour', 'visitor', 'whatsapp', 'old_inquiry', 'other_islander'] as const;
const ADMISSIONS_SOURCE_LABELS: Record<string, string> = {
  school_tour: 'School tour',
  visitor: 'Walk-in visitor',
  whatsapp: 'WhatsApp',
  old_inquiry: 'Older enquiry, followed up',
  other_islander: 'Other islander referral',
};

const CLASS_BAND_LABELS: Record<string, string> = {
  early_years: 'Early Years / Kindergarten',
  kindergarten: 'Kindergarten',
  primary: 'Primary',
  secondary: 'Secondary',
};

export interface SchoolReportBreakdownRow {
  label: string;
  count: number;
}

export interface SchoolReportEnrolmentRow {
  childFullName: string;
  className: string | null;
  enrolmentDate: string;
}

export interface SchoolReportData {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  enquiriesByType: SchoolReportBreakdownRow[];
  enquiriesTotal: number;
  admissionsLeadsBySource: SchoolReportBreakdownRow[];
  admissionsLeadsTotal: number;
  admissionsLeadsConvertedTotal: number;
  newBookingsCount: number;
  newEnrolments: SchoolReportEnrolmentRow[];
  newEnrolmentsCount: number;
  activeStudentsByClassBand: SchoolReportBreakdownRow[];
  activeStudentsTotal: number;
  newStaffCount: number;
  generatedAt: string;
}

/** `< (end + 1 day)` rather than `<= end::date` -- every table queried by created_at here is
 * TIMESTAMPTZ, and a plain `<=` against a bare date would truncate away same-day records after
 * midnight. Every column that's a plain DATE (enrolment_date, start_date) uses a normal BETWEEN
 * instead, matching budget.ts's own convention for date-only columns. */
export async function getSchoolReportData(periodStart: string, periodEnd: string, periodLabel: string): Promise<SchoolReportData> {
  const enquiryRows = (await sql`
    SELECT type, COUNT(*)::int AS count FROM enquiries
    WHERE created_at >= ${periodStart}::date AND created_at < (${periodEnd}::date + interval '1 day')
    GROUP BY type
  `) as unknown as { type: string; count: number }[];
  const enquiryCountByType = new Map(enquiryRows.map((r) => [r.type, r.count]));
  const enquiriesByType = ENQUIRY_TYPES.map((type) => ({ label: ENQUIRY_TYPE_LABELS[type], count: enquiryCountByType.get(type) ?? 0 }));
  const enquiriesTotal = enquiriesByType.reduce((sum, r) => sum + r.count, 0);

  const admissionsRows = (await sql`
    SELECT source, COUNT(*)::int AS count FROM admissions_enquiries
    WHERE created_at >= ${periodStart}::date AND created_at < (${periodEnd}::date + interval '1 day')
    GROUP BY source
  `) as unknown as { source: string; count: number }[];
  const admissionsCountBySource = new Map(admissionsRows.map((r) => [r.source, r.count]));
  const admissionsLeadsBySource = ADMISSIONS_SOURCES.map((source) => ({
    label: ADMISSIONS_SOURCE_LABELS[source],
    count: admissionsCountBySource.get(source) ?? 0,
  }));
  const admissionsLeadsTotal = admissionsLeadsBySource.reduce((sum, r) => sum + r.count, 0);

  const [{ count: admissionsLeadsConvertedTotal }] = (await sql`
    SELECT COUNT(*)::int AS count FROM admissions_enquiries
    WHERE created_at >= ${periodStart}::date AND created_at < (${periodEnd}::date + interval '1 day')
      AND converted_child_id IS NOT NULL
  `) as unknown as { count: number }[];

  const [{ count: newBookingsCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM bookings
    WHERE created_at >= ${periodStart}::date AND created_at < (${periodEnd}::date + interval '1 day')
      AND status != 'cancelled'
  `) as unknown as { count: number }[];

  const newEnrolments = (await sql`
    SELECT child_full_name, class_name, enrolment_date::text
    FROM children
    WHERE enrolment_date BETWEEN ${periodStart}::date AND ${periodEnd}::date
      AND status = ANY(${ACTIVE_STATUSES})
    ORDER BY enrolment_date, child_full_name
  `) as unknown as { child_full_name: string; class_name: string | null; enrolment_date: string }[];

  // A live headcount, not "as of periodEnd" -- is_active has no historical trail, so for a past
  // period this is deliberately labeled in the PDF as today's snapshot rather than implying a
  // precision the data can't actually support.
  const classBandRows = (await sql`
    SELECT class_band, COUNT(*)::int AS count
    FROM children
    WHERE is_active = true AND status = ANY(${ACTIVE_STATUSES})
    GROUP BY class_band
  `) as unknown as { class_band: string | null; count: number }[];
  const activeStudentsByClassBand = classBandRows
    .filter((r) => r.class_band)
    .map((r) => ({ label: CLASS_BAND_LABELS[r.class_band as string] ?? (r.class_band as string), count: r.count }));
  const activeStudentsTotal = activeStudentsByClassBand.reduce((sum, r) => sum + r.count, 0);

  const [{ count: newStaffCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM admin_users
    WHERE start_date BETWEEN ${periodStart}::date AND ${periodEnd}::date
  `) as unknown as { count: number }[];

  return {
    periodLabel,
    periodStart,
    periodEnd,
    enquiriesByType,
    enquiriesTotal,
    admissionsLeadsBySource,
    admissionsLeadsTotal,
    admissionsLeadsConvertedTotal,
    newBookingsCount,
    newEnrolments: newEnrolments.map((r) => ({ childFullName: r.child_full_name, className: r.class_name, enrolmentDate: r.enrolment_date })),
    newEnrolmentsCount: newEnrolments.length,
    activeStudentsByClassBand,
    activeStudentsTotal,
    newStaffCount,
    generatedAt: new Date().toISOString(),
  };
}
