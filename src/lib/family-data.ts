export type ChildStatus = 'enquiry' | 'booking_waitlist' | 'full_time' | 'temporary' | 'worldschooler' | 'hybrid';
export type ClassBand = 'early_years' | 'kindergarten' | 'primary' | 'secondary';

/** Fixed color legend for the status board (Phase 2) and any status pill elsewhere. */
export const STATUS_LEGEND: Record<ChildStatus, { label: string; badgeClass: string; dotClass: string }> = {
  enquiry: { label: 'Enquiry', badgeClass: 'bg-sand text-ink-soft', dotClass: 'bg-ink-soft' },
  booking_waitlist: { label: 'Booking / Waitlist', badgeClass: 'bg-orange/20 text-orange-deep', dotClass: 'bg-orange' },
  full_time: { label: 'Full Time', badgeClass: 'bg-teal/15 text-teal-deep', dotClass: 'bg-teal' },
  temporary: { label: 'Temporary', badgeClass: 'bg-lightteal/20 text-teal-deep', dotClass: 'bg-lightteal' },
  worldschooler: { label: 'Worldschooler', badgeClass: 'bg-aqua/40 text-teal-deep', dotClass: 'bg-aqua' },
  hybrid: { label: 'Hybrid', badgeClass: 'bg-orange-deep/20 text-orange-deep', dotClass: 'bg-orange-deep' },
};

export const STATUS_ORDER: ChildStatus[] = [
  'enquiry',
  'booking_waitlist',
  'full_time',
  'temporary',
  'worldschooler',
  'hybrid',
];

export const CLASS_BAND_LABELS: Record<ClassBand, string> = {
  early_years: 'Early Years',
  kindergarten: 'Kindergarten',
  primary: 'Primary',
  secondary: 'Secondary',
};

export const CLASS_BAND_ORDER: ClassBand[] = ['early_years', 'kindergarten', 'primary', 'secondary'];

export const ENQUIRY_SOURCE_LABELS: Record<string, string> = {
  school_tour: 'School Tour',
  visitor: 'Visitor',
  whatsapp: 'WhatsApp',
  old_inquiry: 'Old Inquiry',
  other_islander: 'Other Islander',
};

/** The 7 compliance forms tracked on the Dashboard sheet's "Forms outstanding" tile — NISN
 * Request is deliberately not one of them there (it's a government ID registration process
 * tracked separately, not a signed consent form) even though it lives in the same spreadsheet
 * group. */
export const COMPLIANCE_ITEMS = [
  { signedKey: 'liability_form_signed', dateKey: 'liability_form_date', label: 'Liability Form' },
  { signedKey: 'photography_signed', dateKey: 'photography_form_date', label: 'Photography / Social Media' },
  { signedKey: 'pickup_authorization_signed', dateKey: 'pickup_form_date', label: 'Pickup Authorization' },
  { signedKey: 'behavioral_form_signed', dateKey: 'behavioral_form_date', label: 'Behavioral / Code of Conduct' },
  { signedKey: 'financial_agreement_signed', dateKey: 'financial_agreement_date', label: 'Financial Agreement' },
  { signedKey: 'parent_protection_addendum_signed', dateKey: null, label: 'Parent Protection Addendum (Primary)' },
  { signedKey: 'data_consent_signed', dateKey: null, label: 'Personal Data Consent (UU 27/2022)' },
] as const;

/**
 * Best-effort class-band guess from a free-text class/grade label (e.g. "G 6", "Stars",
 * "Kindergarten"). Grades 1-6 -> primary, 7-9 -> secondary, matching the Dashboard sheet's "By
 * Programme" grouping (Kindergarten / Primary / Lower Secondary). Returns null rather than
 * guessing wrong when the label doesn't contain a recognizable grade or band keyword.
 */
export function classBandFromLabel(label: string | null | undefined): ClassBand | null {
  if (!label) return null;
  const normalized = label.trim().toLowerCase();
  if (/early\s*years?/.test(normalized)) return 'early_years';
  if (/kinder(garten)?|\btk\b/.test(normalized)) return 'kindergarten';
  const gradeMatch = normalized.match(/\bg(?:rade)?\s*(\d{1,2})\b/);
  if (gradeMatch) {
    const grade = Number(gradeMatch[1]);
    if (grade >= 1 && grade <= 6) return 'primary';
    if (grade >= 7 && grade <= 12) return 'secondary';
  }
  if (/primary/.test(normalized)) return 'primary';
  if (/secondary/.test(normalized)) return 'secondary';
  return null;
}
