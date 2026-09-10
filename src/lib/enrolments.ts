import { ensureSchema, sql } from './db';
import { sendEnrolmentAutoReply, sendEnrolmentNotification, sendMeetingScheduleEmail, type EnrolmentEmailInput } from './email';
import { findOrCreateFamilyForContact, logFamilyActivity } from './family-matching';
import { populateChildFromEnrolment } from './child-lifecycle';
import { createMeetingInvite } from './meeting-scheduling';
import { isCalendarConnected } from './google-calendar';
import { siteConfig } from './site-content';
import type { EnrolmentInput } from './validation';

export interface SubmitEnrolmentResult {
  id: number;
  notifySent: boolean;
  replySent: boolean;
}

/** Loads one enrolment_submissions row back into the same shape submitEnrolment's caller
 * originally posted, so linkEnrolmentToFamily can re-run the exact same linking pipeline the
 * initial submission attempted -- used for the admin "Link to Family Board" retry action. */
async function loadEnrolmentAsInput(submissionId: number): Promise<EnrolmentInput & { id: number }> {
  const rows = (await sql`
    SELECT id, student_name, student_dob::text, previous_school, previous_grade, siblings_attending,
      start_date::text, enrolment_length, enrolment_length_other,
      kitas_status, kitas_notes, passport_number, passport_nationality, passport_expiry::text,
      photography_consent, medical_conditions, allergies,
      lunch_option, lunch_other_notes, shuttle_service,
      emergency_contact_name, emergency_contact_phone, authorized_pickup,
      parent_name, parent_email, parent_whatsapp
    FROM enrolment_submissions WHERE id = ${submissionId}
  `) as unknown as Record<string, unknown>[];
  const row = rows[0];
  if (!row) throw new Error(`No enrolment_submissions row with id ${submissionId}`);

  return {
    id: submissionId,
    studentName: row.student_name as string,
    studentDob: row.student_dob as string,
    previousSchool: (row.previous_school as string | null) ?? '',
    previousGrade: (row.previous_grade as string | null) ?? '',
    siblingsAttending: (row.siblings_attending as string | null) ?? '',
    startDate: row.start_date as string,
    enrolmentLength: row.enrolment_length as EnrolmentInput['enrolmentLength'],
    enrolmentLengthOther: (row.enrolment_length_other as string | null) ?? '',
    kitasStatus: row.kitas_status as EnrolmentInput['kitasStatus'],
    kitasNotes: (row.kitas_notes as string | null) ?? '',
    passportNumber: (row.passport_number as string | null) ?? '',
    passportNationality: (row.passport_nationality as string | null) ?? '',
    passportExpiry: (row.passport_expiry as string | null) ?? '',
    photographyConsent: row.photography_consent ? 'yes' : 'no',
    medicalConditions: (row.medical_conditions as string | null) ?? '',
    allergies: (row.allergies as string | null) ?? '',
    lunchOption: row.lunch_option as EnrolmentInput['lunchOption'],
    lunchOtherNotes: (row.lunch_other_notes as string | null) ?? '',
    shuttleService: row.shuttle_service ? 'yes' : 'no',
    emergencyContactName: row.emergency_contact_name as string,
    emergencyContactPhone: row.emergency_contact_phone as string,
    authorizedPickup: (row.authorized_pickup as string | null) ?? '',
    parentName: row.parent_name as string,
    parentEmail: row.parent_email as string,
    parentWhatsapp: row.parent_whatsapp as string,
  };
}

/** Finds-or-creates the Family Board card for one enrolment submission, populates it from the
 * form, and records the link on both sides (family_activity_log, and enrolment_submissions.
 * linked_child_id so the Enrolments admin list can show whether this ever happened without
 * joining through the activity log). Safe to call more than once for the same submission --
 * findOrCreateFamilyForContact matches by email/phone before creating, and
 * populateChildFromEnrolment is a plain UPDATE with COALESCE fallbacks -- which is what makes this
 * safe to expose as an admin "Link to Family Board" retry action for a submission whose original,
 * automatic attempt (inside submitEnrolment) failed and was only logged. */
export async function linkEnrolmentToFamily(submissionId: number): Promise<number> {
  const record = await loadEnrolmentAsInput(submissionId);
  const childId = await findOrCreateFamilyForContact({
    parentName: record.parentName,
    parentEmail: record.parentEmail,
    parentPhone: record.parentWhatsapp,
    childName: record.studentName,
  });
  await logFamilyActivity(childId, 'new_student_enrolment_form', 'enrolment_submissions', submissionId);
  await populateChildFromEnrolment(childId, record, submissionId);
  await sql`UPDATE enrolment_submissions SET linked_child_id = ${childId} WHERE id = ${submissionId}`;
  return childId;
}

/** Writes the enrolment submission to Postgres first, then sends both emails, then records delivery status. */
export async function submitEnrolment(record: EnrolmentInput): Promise<SubmitEnrolmentResult> {
  await ensureSchema();

  const rows = await sql`
    INSERT INTO enrolment_submissions (
      student_name, student_dob, previous_school, previous_grade, siblings_attending,
      start_date, enrolment_length, enrolment_length_other,
      kitas_status, kitas_notes, passport_number, passport_nationality, passport_expiry,
      photography_consent, medical_conditions, allergies,
      lunch_option, lunch_other_notes, shuttle_service,
      emergency_contact_name, emergency_contact_phone, authorized_pickup,
      parent_name, parent_email, parent_whatsapp
    )
    VALUES (
      ${record.studentName}, ${record.studentDob}, ${record.previousSchool || null}, ${record.previousGrade || null}, ${record.siblingsAttending || null},
      ${record.startDate}, ${record.enrolmentLength}, ${record.enrolmentLengthOther || null},
      ${record.kitasStatus}, ${record.kitasNotes || null}, ${record.passportNumber || null}, ${record.passportNationality || null}, ${record.passportExpiry || null},
      ${record.photographyConsent === 'yes'}, ${record.medicalConditions || null}, ${record.allergies || null},
      ${record.lunchOption}, ${record.lunchOtherNotes || null}, ${record.shuttleService === 'yes'},
      ${record.emergencyContactName}, ${record.emergencyContactPhone}, ${record.authorizedPickup || null},
      ${record.parentName}, ${record.parentEmail}, ${record.parentWhatsapp}
    )
    RETURNING id
  `;
  const id = rows[0].id as number;

  // Unlike the enquiry forms, every enrolment submission names a specific child, so this always
  // runs. Linking failure is logged and swallowed rather than thrown, so a Family Board hiccup
  // never stops the enrolment itself from being saved and emailed -- see linkEnrolmentToFamily's
  // own comment for why it's also exposed as an admin retry action for exactly this case.
  let linkedChildId: number | null = null;
  try {
    linkedChildId = await linkEnrolmentToFamily(id);
  } catch (err) {
    console.error('[enrolments] family linking failed (enrolment itself still saved)', { id, err });
  }

  // Automatically invites the parent to book a meeting the moment the form lands — same
  // meeting_invites/Google Calendar flow as the manual "Schedule a meeting" button on a Letter of
  // Offer (see LetterOfOfferSection.tsx), just triggered earlier and with no letter attached yet
  // (letterOfOfferId is nullable for exactly this case). Silently skipped if Google Calendar isn't
  // connected yet, or if anything here fails — this is a nice-to-have on top of the enrolment
  // submission, never a reason to block it.
  if (linkedChildId) {
    try {
      if (await isCalendarConnected()) {
        const { token } = await createMeetingInvite({
          childId: linkedChildId,
          letterOfOfferId: null,
          parentEmail: record.parentEmail,
        });
        const scheduleUrl = new URL(`/schedule-meeting/${token}`, siteConfig.url).toString();
        await sendMeetingScheduleEmail({
          toEmail: record.parentEmail,
          childFullName: record.studentName,
          scheduleUrl,
        });
      }
    } catch (err) {
      console.error('[enrolments] automatic meeting invite failed (enrolment itself still saved)', { id, err });
    }
  }

  const emailInput: EnrolmentEmailInput = {
    studentName: record.studentName,
    studentDob: record.studentDob,
    previousSchool: record.previousSchool,
    previousGrade: record.previousGrade,
    siblingsAttending: record.siblingsAttending,
    startDate: record.startDate,
    enrolmentLength: record.enrolmentLength,
    enrolmentLengthOther: record.enrolmentLengthOther,
    kitasStatus: record.kitasStatus,
    kitasNotes: record.kitasNotes,
    passportNumber: record.passportNumber,
    passportNationality: record.passportNationality,
    passportExpiry: record.passportExpiry,
    photographyConsent: record.photographyConsent,
    medicalConditions: record.medicalConditions,
    allergies: record.allergies,
    lunchOption: record.lunchOption,
    lunchOtherNotes: record.lunchOtherNotes,
    shuttleService: record.shuttleService,
    emergencyContactName: record.emergencyContactName,
    emergencyContactPhone: record.emergencyContactPhone,
    authorizedPickup: record.authorizedPickup,
    parentName: record.parentName,
    parentEmail: record.parentEmail,
    parentWhatsapp: record.parentWhatsapp,
  };

  const notifySent = await sendEnrolmentNotification(emailInput);
  const replySent = await sendEnrolmentAutoReply(emailInput);

  await sql`
    UPDATE enrolment_submissions
    SET notify_email_status = ${notifySent ? 'sent' : 'failed'},
        reply_email_status = ${replySent ? 'sent' : 'failed'}
    WHERE id = ${id}
  `;

  if (!notifySent) {
    console.error('[enrolments] notification email failed to send', { id });
  }

  return { id, notifySent, replySent };
}
