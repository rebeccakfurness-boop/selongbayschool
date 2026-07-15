import { ensureSchema, sql } from './db';
import { sendEnquiryAutoReply, sendEnquiryNotification, type EnquiryEmailInput, type EnquiryType } from './email';

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
