import { ensureSchema, sql } from './db';
import { sendEnquiryAutoReply, sendEnquiryNotification, sendMeetingScheduleEmail, type EnquiryEmailInput, type EnquiryType } from './email';
import { findOrCreateFamilyForContact, logFamilyActivity } from './family-matching';
import { createMeetingInvite } from './meeting-scheduling';
import { isCalendarConnected } from './google-calendar';
import { siteConfig } from './site-content';

export interface EnquiryRecord {
  type: EnquiryType;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  childName?: string | null;
  childAge?: string | null;
  interest?: string | null;
}

export interface SubmitResult {
  id: number;
  notifySent: boolean;
  replySent: boolean;
}

/** Writes the enquiry to Postgres first, then sends both emails, then records delivery status. */
export async function submitEnquiry(record: EnquiryRecord): Promise<SubmitResult> {
  await ensureSchema();

  const rows = await sql`
    INSERT INTO enquiries (type, name, email, phone, message, child_name, child_age, interest)
    VALUES (${record.type}, ${record.name}, ${record.email}, ${record.phone ?? null}, ${record.message ?? null},
            ${record.childName ?? null}, ${record.childAge ?? null}, ${record.interest ?? null})
    RETURNING id
  `;
  const id = rows[0].id as number;

  // The contact form also feeds the newer CRM table (source='contact_form'), which nothing else
  // writes to yet; admissions/high-school enquiries stay in `enquiries` only, since 'contact_form'
  // is the only source value that applies to them.
  if (record.type === 'contact') {
    await sql`
      INSERT INTO crm_enquiries (source, customer_name, customer_email, customer_phone, message)
      VALUES ('contact_form', ${record.name}, ${record.email}, ${record.phone ?? null}, ${record.message ?? null})
    `;
  }

  // Only enquiries naming a specific child feed the Family Board — a general "tell me more about
  // the school" contact-form message with no child name isn't a family to track yet. Linking
  // failure is logged and swallowed rather than thrown, so a Family Board hiccup never stops the
  // enquiry itself from being saved and emailed.
  let linkedChildId: number | null = null;
  if (record.childName) {
    try {
      linkedChildId = await findOrCreateFamilyForContact({
        parentName: record.name,
        parentEmail: record.email,
        parentPhone: record.phone,
        childName: record.childName,
      });
      await logFamilyActivity(
        linkedChildId,
        'current_enrolment_enquiry',
        'enquiries',
        id,
        `${record.interest || 'General'} enquiry via the ${record.type} form.`
      );
    } catch (err) {
      console.error('[enquiries] family linking failed (enquiry itself still saved)', { id, err });
    }
  }

  // Automatically invites the enquirer to book a meeting the moment any enquiry naming a child
  // lands — same meeting_invites/Google Calendar flow as the Student Enrolment Form's automatic
  // invite (see submitEnrolment in enrolments.ts) and the manual "Schedule a meeting" button on a
  // Letter of Offer. Only fires once there's a child card to attach the invite to (meeting_invites.
  // child_id is required), so a general contact-form message naming no specific child doesn't get
  // one — there's nothing yet to schedule a meeting about. Silently skipped if Google Calendar
  // isn't connected, or if anything here fails — a nice-to-have on top of the enquiry, never a
  // reason to block it.
  if (linkedChildId) {
    try {
      if (await isCalendarConnected()) {
        const { token } = await createMeetingInvite({
          childId: linkedChildId,
          letterOfOfferId: null,
          parentEmail: record.email,
        });
        const scheduleUrl = new URL(`/schedule-meeting/${token}`, siteConfig.url).toString();
        await sendMeetingScheduleEmail({
          toEmail: record.email,
          childFullName: record.childName!,
          scheduleUrl,
        });
      }
    } catch (err) {
      console.error('[enquiries] automatic meeting invite failed (enquiry itself still saved)', { id, err });
    }
  }

  const emailInput: EnquiryEmailInput = {
    type: record.type,
    name: record.name,
    email: record.email,
    phone: record.phone,
    message: record.message,
    childName: record.childName,
    childAge: record.childAge,
    interest: record.interest,
  };

  const notifySent = await sendEnquiryNotification(emailInput);
  const replySent = await sendEnquiryAutoReply(emailInput);

  await sql`
    UPDATE enquiries
    SET notify_email_status = ${notifySent ? 'sent' : 'failed'},
        reply_email_status = ${replySent ? 'sent' : 'failed'}
    WHERE id = ${id}
  `;

  if (!notifySent) {
    console.error('[enquiries] notification email failed to send', { id, type: record.type });
  }

  return { id, notifySent, replySent };
}
