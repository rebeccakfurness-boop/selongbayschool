import { ensureSchema, sql } from './db';
import { sendEnrolmentAutoReply, sendEnrolmentNotification, type EnrolmentEmailInput } from './email';
import { findOrCreateFamilyForContact, logFamilyActivity } from './family-matching';
import type { EnrolmentInput } from './validation';

export interface SubmitEnrolmentResult {
  id: number;
  notifySent: boolean;
  replySent: boolean;
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
  // never stops the enrolment itself from being saved and emailed.
  try {
    const childId = await findOrCreateFamilyForContact({
      parentName: record.parentName,
      parentEmail: record.parentEmail,
      parentPhone: record.parentWhatsapp,
      childName: record.studentName,
    });
    await logFamilyActivity(childId, 'new_student_enrolment_form', 'enrolment_submissions', id);
  } catch (err) {
    console.error('[enrolments] family linking failed (enrolment itself still saved)', { id, err });
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
