import { sql } from '@/lib/db';
import type { ChildStatus } from '@/lib/family-data';
import type { CreateChildInput, EnrolmentInput } from '@/lib/validation';
import { isActiveStatus } from '@/lib/child-lifecycle-shared';

export * from '@/lib/child-lifecycle-shared';

/** Shared by POST /api/admin/children (blank "+ New Family" form) and
 * POST /api/admin/admissions-enquiries/[id]/convert (prefilled from a lead) — same INSERT either
 * way, so the two creation paths can't drift apart. admissionsNotes is only ever passed by the
 * convert route (see convertAdmissionsEnquiry below); the blank-form path leaves it null. */
export async function createChild(d: CreateChildInput, admissionsNotes?: string | null): Promise<number> {
  const rows = await sql`
    INSERT INTO children (
      child_full_name, child_nickname, status, is_active, programme, class_band, class_name,
      dob, gender, nationality, enrolment_date, parent1_name, parent1_relationship,
      parent1_nationality, parent2_name, parent2_relationship, parent2_nationality,
      primary_contact_email, primary_contact_phone, emergency_contact_name, emergency_contact_phone,
      allergies_medical_notes, dietary_requirements, religion, home_language, admissions_notes
    ) VALUES (
      ${d.childFullName}, ${d.childNickname ?? null}, ${d.status ?? 'enquiry'}, ${d.isActive ?? true},
      ${d.programme ?? null}, ${d.classBand ?? null}, ${d.className ?? null},
      ${d.dob ?? null}::date, ${d.gender ?? null}, ${d.nationality ?? null}, ${d.enrolmentDate ?? null}::date,
      ${d.parent1Name ?? null}, ${d.parent1Relationship ?? null}, ${d.parent1Nationality ?? null},
      ${d.parent2Name ?? null}, ${d.parent2Relationship ?? null}, ${d.parent2Nationality ?? null},
      ${d.primaryContactEmail ?? null}, ${d.primaryContactPhone ?? null},
      ${d.emergencyContactName ?? null}, ${d.emergencyContactPhone ?? null},
      ${d.allergiesMedicalNotes ?? null}, ${d.dietaryRequirements ?? null}, ${d.religion ?? null}, ${d.homeLanguage ?? null},
      ${admissionsNotes ?? null}
    )
    RETURNING id
  `;
  return rows[0].id as number;
}

export interface AdmissionsEnquiryRow {
  id: number;
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
  converted_child_id: number | null;
}

const SOURCE_LABELS: Record<string, string> = {
  school_tour: 'School Tour',
  visitor: 'Visitor',
  whatsapp: 'WhatsApp',
  old_inquiry: 'Old Inquiry',
  other_islander: 'Other Islander',
};

/** Rolls up everything from the lead that has no direct children column (child_age is a free-text
 * guess, not a dob; plan_to_stay, follow_up_notes, the source, and the contact-history dates) into
 * one readable note, so "Convert to Family" loses nothing even though it only writes 4-5 real
 * columns directly. */
export function admissionsNotesFromEnquiry(row: AdmissionsEnquiryRow): string {
  const lines: string[] = [`Converted from admissions pipeline lead #${row.id} (${SOURCE_LABELS[row.source] || row.source}).`];
  if (row.child_age) lines.push(`Child age at first contact: ${row.child_age}.`);
  if (row.plan_to_stay) lines.push(`Plan to stay: ${row.plan_to_stay}.`);
  if (row.first_message_date) lines.push(`First contact: ${row.first_message_date}.`);
  if (row.visit_date) lines.push(`Tour/visit date: ${row.visit_date}.`);
  if (row.booking_date) lines.push(`Booking date: ${row.booking_date}${row.booking_time ? ` ${row.booking_time}` : ''}.`);
  if (row.follow_up_notes) lines.push(`Follow-up notes: ${row.follow_up_notes}`);
  return lines.join(' ');
}

/** Marks the lead "converted/archived" without deleting it (converted_child_id already existed on
 * admissions_enquiries — see src/lib/db.ts — for exactly this, it just had no writer before now),
 * so the funnel source stays traceable for admissions reporting. New family record always starts
 * at status='enquiry': this action's job is "stop retyping what's already on file," not "decide
 * this is a firm booking" — that's still a separate, explicit drag to the Booking column, same as
 * any other card. */
export async function convertAdmissionsEnquiry(
  enquiry: AdmissionsEnquiryRow,
  d: CreateChildInput
): Promise<number> {
  const childId = await createChild({ ...d, status: 'enquiry', isActive: true }, admissionsNotesFromEnquiry(enquiry));
  await sql`UPDATE admissions_enquiries SET converted_child_id = ${childId} WHERE id = ${enquiry.id}`;
  return childId;
}

const ENROLMENT_LENGTH_LABELS: Record<string, string> = {
  '1_week': '1 week',
  '1_month': '1 month',
  '1_term': '1 term',
  full_year: 'Full year',
  ongoing: 'Ongoing / not yet decided',
  other: 'Other',
};

const KITAS_STATUS_LABELS: Record<string, string> = {
  has_kitas: 'Has KITAS',
  in_progress: 'In progress',
  not_applicable: 'Not applicable',
  other: 'Other',
};

const LUNCH_OPTION_LABELS: Record<string, string> = {
  bring_own: 'Bringing own lunch',
  godspeed: 'Direct lunch order',
};

/** Rolls up everything from a Student Enrolment Form submission that has no direct `children`
 * column — the same job admissionsNotesFromEnquiry does for the admissions pipeline. Passport
 * number/expiry and shuttle service have nowhere else to live on the child record; enrolment
 * length and previous grade are informative but not worth a dedicated column each. */
export function enrolmentNotesFromSubmission(record: EnrolmentInput, submissionId: number): string {
  const lines: string[] = [`From Student Enrolment Form submission #${submissionId}.`];
  const length = ENROLMENT_LENGTH_LABELS[record.enrolmentLength] || record.enrolmentLength;
  lines.push(`Planned length of enrolment: ${length}${record.enrolmentLengthOther ? ` (${record.enrolmentLengthOther})` : ''}.`);
  if (record.previousGrade) lines.push(`Previous grade: ${record.previousGrade}.`);
  if (record.passportNumber) lines.push(`Passport number: ${record.passportNumber}.`);
  if (record.passportExpiry) lines.push(`Passport expiry: ${record.passportExpiry}.`);
  lines.push(`Shuttle service requested: ${record.shuttleService === 'yes' ? 'Yes' : 'No'}.`);
  if (record.lunchOption === 'other' && record.lunchOtherNotes) lines.push(`Lunch notes: ${record.lunchOtherNotes}.`);
  return lines.join(' ');
}

/** Applies everything the Student Enrolment Form collects that DOES have a direct home on the
 * child record — run right after findOrCreateFamilyForContact links/creates the card, so a family
 * that submits this form never has to have their details re-typed by hand onto the Child Card.
 * Required-on-the-form fields (dob, start date, emergency contact, lunch, parent contact details)
 * are set outright, since the parent's own just-submitted answer is the most current, authoritative
 * version; genuinely optional fields use COALESCE so a blank answer never clears something already
 * on file. admissions_notes is replaced outright (see enrolmentNotesFromSubmission) — there's no
 * established "append" convention for that column elsewhere in the app (createChild only ever sets
 * it once, at creation). */
export async function populateChildFromEnrolment(childId: number, record: EnrolmentInput, submissionId: number): Promise<void> {
  const allergiesMedicalNotes = [record.allergies, record.medicalConditions].filter(Boolean).join('; ') || null;
  const lunchOption =
    record.lunchOption === 'other' ? record.lunchOtherNotes || 'Other' : LUNCH_OPTION_LABELS[record.lunchOption];
  const kitasLabel = KITAS_STATUS_LABELS[record.kitasStatus] || record.kitasStatus;
  const visaStatus = `${kitasLabel}${record.kitasNotes ? ` — ${record.kitasNotes}` : ''}`;
  const photographyConsent = record.photographyConsent === 'yes' ? 'Consented via Student Enrolment Form' : 'Declined via Student Enrolment Form';

  await sql`
    UPDATE children SET
      dob = ${record.studentDob}::date,
      enrolment_date = ${record.startDate}::date,
      previous_school = COALESCE(${record.previousSchool || null}, previous_school),
      siblings_at_school = COALESCE(${record.siblingsAttending || null}, siblings_at_school),
      nationality = COALESCE(${record.passportNationality || null}, nationality),
      visa_status = ${visaStatus},
      allergies_medical_notes = COALESCE(${allergiesMedicalNotes}, allergies_medical_notes),
      lunch_option = ${lunchOption},
      emergency_contact_name = ${record.emergencyContactName},
      emergency_contact_phone = ${record.emergencyContactPhone},
      authorized_pickup_persons = COALESCE(${record.authorizedPickup || null}, authorized_pickup_persons),
      photography_consent = ${photographyConsent},
      parent1_name = ${record.parentName},
      primary_contact_email = ${record.parentEmail},
      primary_contact_phone = ${record.parentWhatsapp},
      admissions_notes = ${enrolmentNotesFromSubmission(record, submissionId)},
      updated_at = now()
    WHERE id = ${childId}
  `;
}

export type StatusTransitionResult = { ok: true } | { ok: false; error: string };

/** The guard rail from the lifecycle spec: a card can't land in an active column (the live
 * calendar + roster) without an enrolment date and programme type already on file. Reads the child's
 * current enrolment_date/programme rather than trusting the request body, since the drag payload
 * carries only the target status/isActive — this only matters when actually entering (not already
 * in) an active status, so moving between two active statuses, or dropping to Inactive, is never
 * blocked by it. */
export async function checkActiveStatusGuardRail(childId: number, targetStatus: ChildStatus): Promise<StatusTransitionResult> {
  if (!isActiveStatus(targetStatus)) return { ok: true };
  const rows = await sql`SELECT enrolment_date, programme, status FROM children WHERE id = ${childId}`;
  const child = rows[0];
  if (!child) return { ok: false, error: 'Child not found.' };
  if (child.status === targetStatus) return { ok: true };
  if (!child.enrolment_date || !child.programme) {
    return { ok: false, error: 'Set enrolment date and programme type first (Edit on the Child Card).' };
  }
  return { ok: true };
}

/** True the first time a child crosses into an active status with a real tuition invoice still
 * outstanding to create — used to decide whether to send the "create the tuition invoice" nudge
 * (see sendChildActivatedInvoicePrompt in src/lib/email.ts). Not auto-creating the invoice itself:
 * there's no fee-schedule table to compute a real total_amount from (tuition_plan is free text,
 * not a price), and a parent-visible invoice with a guessed amount would be worse than no invoice
 * — same reasoning already applied to the Letter-of-Offer-acceptance flow, which nudges rather
 * than silently generates. */
export async function needsTuitionInvoicePrompt(childId: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM invoices i
    JOIN invoice_children ic ON ic.invoice_id = i.id
    WHERE ic.child_id = ${childId} AND i.invoice_type = 'tuition' AND i.status <> 'cancelled'
  `;
  return rows.length === 0;
}
