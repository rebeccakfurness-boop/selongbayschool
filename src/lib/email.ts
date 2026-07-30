import * as brevo from '@getbrevo/brevo';
import { siteConfig, bankTransferDetails, formatIDR } from './site-content';

const NOTIFY_TO = siteConfig.contact.email;
const SENDER = { name: 'Selong Bay School', email: siteConfig.contact.email };

let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not set');
    }
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }
  return apiInstance;
}

function wrapEmail(title: string, bodyHtml: string): string {
  const logoUrl = `${siteConfig.url}/images/logo-full.png`;
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #fffdf8;">
    <div style="background: #007c83; padding: 20px 28px;">
      <img src="${logoUrl}" alt="Selong Bay School" width="140" height="111" style="display: block; border: 0;" />
    </div>
    <div style="padding: 28px; color: #17282b;">
      <h1 style="font-size: 20px; margin: 0 0 16px; color: #045157;">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="background: #dad0bc; padding: 16px 28px; font-size: 12px; color: #3f5559;">
      ${siteConfig.contact.address}<br />
      ${siteConfig.contact.phone} &middot; ${siteConfig.contact.email}
    </div>
  </div>`;
}

function fieldRows(fields: Array<[string, string | null | undefined]>): string {
  return `<table style="width: 100%; border-collapse: collapse;">${fields
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding: 6px 12px 6px 0; font-weight: 700; color: #045157; vertical-align: top; white-space: nowrap;">${label}</td>
        <td style="padding: 6px 0; color: #17282b;">${value}</td>
      </tr>`
    )
    .join('')}</table>`;
}

async function send(
  to: string,
  subject: string,
  html: string,
  options?: { replyTo?: string; cc?: string; attachment?: { name: string; content: string }[] }
): Promise<boolean> {
  try {
    const email = new brevo.SendSmtpEmail();
    email.sender = SENDER;
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = html;
    if (options?.replyTo) email.replyTo = { email: options.replyTo };
    if (options?.cc) email.cc = [{ email: options.cc }];
    if (options?.attachment) email.attachment = options.attachment;

    await getBrevoClient().sendTransacEmail(email);
    return true;
  } catch (err) {
    console.error('[email] Failed to send email', { to, subject, err });
    return false;
  }
}

export type EnquiryType = 'contact' | 'admissions' | 'high_school';

export interface EnquiryEmailInput {
  type: EnquiryType;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  childName?: string | null;
  childAge?: string | null;
  interest?: string | null;
}

const enquiryTypeLabels: Record<EnquiryType, string> = {
  contact: 'General Enquiry',
  admissions: 'Admissions Enquiry',
  high_school: 'High School Enquiry',
};

const admissionsInterestSources: Record<string, string> = {
  Preschool: 'Preschool Admissions Form',
  Primary: 'Primary Admissions Form',
  'Secondary School': 'Secondary School Admissions Form',
};

/** Human-readable label for exactly which form on the site an enquiry came from, used in the notification subject/heading. */
function resolveSource(type: EnquiryType, interest?: string | null): string {
  if (type === 'contact') return 'Contact Page';
  if (type === 'high_school') return 'Home Page Secondary School Enquiry';
  return (interest && admissionsInterestSources[interest]) || 'Admissions Form';
}

function formatSubmittedAt(date: Date): string {
  const formatted = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Makassar',
  }).format(date);
  return `${formatted} (Lombok time)`;
}

export async function sendEnquiryNotification(input: EnquiryEmailInput): Promise<boolean> {
  const source = resolveSource(input.type, input.interest);
  const html = wrapEmail(
    `New Enquiry: ${source}`,
    fieldRows([
      ['Submitted', formatSubmittedAt(new Date())],
      ['Name', input.name],
      ['Email', input.email],
      ['Phone', input.phone],
      ['Interest', input.interest],
      ["Child's name", input.childName],
      ["Child's age", input.childAge],
      ['Message', input.message?.replace(/\n/g, '<br />')],
    ])
  );
  return send(NOTIFY_TO, `New Enquiry (${source}): ${input.name}`, html, { replyTo: input.email });
}

export async function sendEnquiryAutoReply(input: EnquiryEmailInput): Promise<boolean> {
  const html = wrapEmail(
    `Thanks for reaching out, ${input.name.split(' ')[0]}!`,
    `<p>We've received your ${enquiryTypeLabels[input.type].toLowerCase()} and we'll be in touch soon.</p>
     <p>If anything is urgent, you can reach us directly at
       <a href="mailto:${siteConfig.contact.email}" style="color:#007c83;">${siteConfig.contact.email}</a>
       or ${siteConfig.contact.phone}.</p>
     <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(input.email, "Thanks for your enquiry: Selong Bay School", html, { cc: NOTIFY_TO });
}

export async function sendAdminPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const html = wrapEmail(
    'Reset your admin password',
    `<p>We received a request to reset the password for the Selong Bay School admin account associated with this email address.</p>
     <p><a href="${resetUrl}" style="color:#007c83; font-weight:700;">Reset your password</a></p>
     <p>This link is valid for 1 hour. If you did not request this, you can safely ignore this email and your password will stay the same.</p>`
  );
  return send(email, 'Reset your Selong Bay School admin password', html);
}

export async function sendCustomerMagicLinkEmail(email: string, name: string, verifyUrl: string): Promise<boolean> {
  const html = wrapEmail(
    `Hi ${name.split(' ')[0]}, here's your login link`,
    `<p>Click below to access your Selong Bay School account:</p>
     <p><a href="${verifyUrl}" style="color:#007c83; font-weight:700;">Log in to your account</a></p>
     <p>This link is valid for 30 minutes and can only be used once. If you didn't request this, you can safely ignore this email.</p>`
  );
  return send(email, 'Your Selong Bay School login link', html);
}

export type EnrolmentLength = '1_week' | '1_month' | '1_term' | 'full_year' | 'ongoing' | 'other';
export type KitasStatus = 'has_kitas' | 'in_progress' | 'not_applicable' | 'other';
export type LunchOption = 'bring_own' | 'godspeed' | 'other';

export const enrolmentLengthLabels: Record<EnrolmentLength, string> = {
  '1_week': '1 week',
  '1_month': '1 month',
  '1_term': '1 term',
  full_year: 'Full school year',
  ongoing: 'Ongoing / permanent enrolment',
  other: 'Other',
};

export const kitasStatusLabels: Record<KitasStatus, string> = {
  has_kitas: 'Has KITAS',
  in_progress: 'KITAS application in progress',
  not_applicable: 'Not applicable (Indonesian citizen)',
  other: 'Other',
};

export const lunchOptionLabels: Record<LunchOption, string> = {
  bring_own: 'Bringing their own lunch',
  godspeed: 'Godspeed direct order',
  other: 'Other',
};

export interface EnrolmentEmailInput {
  studentName: string;
  studentDob: string;
  previousSchool?: string | null;
  previousGrade?: string | null;
  siblingsAttending?: string | null;
  startDate: string;
  enrolmentLength: EnrolmentLength;
  enrolmentLengthOther?: string | null;
  kitasStatus: KitasStatus;
  kitasNotes?: string | null;
  passportNumber?: string | null;
  passportNationality?: string | null;
  passportExpiry?: string | null;
  photographyConsent: 'yes' | 'no';
  medicalConditions?: string | null;
  allergies?: string | null;
  lunchOption: LunchOption;
  lunchOtherNotes?: string | null;
  shuttleService: 'yes' | 'no';
  emergencyContactName: string;
  emergencyContactPhone: string;
  authorizedPickup?: string | null;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
}

export async function sendEnrolmentNotification(input: EnrolmentEmailInput): Promise<boolean> {
  const html = wrapEmail(
    'New Student Enrolment Submission',
    fieldRows([
      ['Submitted', formatSubmittedAt(new Date())],
      ["Student's name", input.studentName],
      ["Student's date of birth", input.studentDob],
      ['Previous school', input.previousSchool],
      ['Previous grade', input.previousGrade],
      ['Siblings attending', input.siblingsAttending],
      ['Start date', input.startDate],
      [
        'Length of enrolment',
        input.enrolmentLength === 'other'
          ? [enrolmentLengthLabels.other, input.enrolmentLengthOther].filter(Boolean).join(': ')
          : enrolmentLengthLabels[input.enrolmentLength],
      ],
      ['KITAS status', kitasStatusLabels[input.kitasStatus]],
      ['KITAS notes', input.kitasNotes],
      ['Passport number', input.passportNumber],
      ['Passport nationality', input.passportNationality],
      ['Passport expiry', input.passportExpiry],
      ['Photography consent', input.photographyConsent === 'yes' ? 'Yes' : 'No'],
      ['Medical conditions', input.medicalConditions],
      ['Allergies', input.allergies],
      [
        'Lunch option',
        input.lunchOption === 'other'
          ? [lunchOptionLabels.other, input.lunchOtherNotes].filter(Boolean).join(': ')
          : lunchOptionLabels[input.lunchOption],
      ],
      ['Shuttle service (The Well, Kuta to school and back)', input.shuttleService === 'yes' ? 'Yes' : 'No'],
      ['Emergency contact name', input.emergencyContactName],
      ['Emergency contact phone', input.emergencyContactPhone],
      ['Other authorised pickup/drop-off', input.authorizedPickup],
      ['Parent/guardian name', input.parentName],
      ['Parent/guardian email', input.parentEmail],
      ['Parent/guardian WhatsApp', input.parentWhatsapp],
    ])
  );
  return send(NOTIFY_TO, `New Enrolment Submission: ${input.studentName}`, html, { replyTo: input.parentEmail });
}

export async function sendEnrolmentAutoReply(input: EnrolmentEmailInput): Promise<boolean> {
  const html = wrapEmail(
    `Thanks for your enrolment submission, ${input.parentName.split(' ')[0]}!`,
    `<p>We've received the enrolment details for ${input.studentName} and will be in touch soon with next steps.</p>
     <p>If anything is urgent, you can reach us directly at
       <a href="mailto:${siteConfig.contact.email}" style="color:#007c83;">${siteConfig.contact.email}</a>
       or ${siteConfig.contact.phone}.</p>
     <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(input.parentEmail, 'Thanks for your enrolment submission: Selong Bay School', html, { cc: NOTIFY_TO });
}

export type PaymentMethod = 'pay_online' | 'pay_at_session';
export type BookingPaymentMethod = PaymentMethod | 'pack_session';

export interface BookingEmailInput {
  activityName: string;
  date: string;
  time: string;
  childName: string;
  childAge: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  paymentMethod: BookingPaymentMethod;
  priceIDR: number | null;
  priceNote: string | null;
}

const paymentMethodLabels: Record<BookingPaymentMethod, string> = {
  pay_online: 'Pay online (bank transfer)',
  pay_at_session: 'Pay at the session',
  pack_session: 'Paid with activity pack',
};

function amountLabel(input: Pick<BookingEmailInput, 'priceIDR' | 'priceNote'>): string | null {
  if (input.priceIDR) return formatIDR(input.priceIDR);
  return input.priceNote || null;
}

function bankDetailsHtml(): string {
  return `
    <div style="margin-top: 16px; padding: 16px; background: #f6f1e6; border-radius: 10px;">
      <p style="margin: 0 0 8px; font-weight: 700; color: #045157;">Bank transfer details</p>
      ${fieldRows([
        ['Payable To', bankTransferDetails.payableTo],
        ['Bank', bankTransferDetails.bank],
        ['Account Number', bankTransferDetails.accountNumber],
        ['Name', bankTransferDetails.accountName],
        ['SWIFT Code', bankTransferDetails.swiftCode],
      ])}
    </div>`;
}

export async function sendBookingNotification(input: BookingEmailInput): Promise<boolean> {
  const amount = amountLabel(input);
  const html = wrapEmail(
    'New Activity Booking',
    fieldRows([
      ['Activity', input.activityName],
      ['Date', input.date],
      ['Time', input.time],
      ["Child's name", input.childName],
      ["Child's age", input.childAge],
      ['Parent name', input.parentName],
      ['Parent email', input.parentEmail],
      ['Parent phone', input.parentPhone],
      ['Emergency contact name', input.emergencyContactName],
      ['Emergency contact phone', input.emergencyContactPhone],
      ['Payment method', paymentMethodLabels[input.paymentMethod]],
      ['Amount due', amount],
    ]) + (input.paymentMethod === 'pay_online' ? bankDetailsHtml() : '')
  );
  return send(NOTIFY_TO, `Booking: ${input.activityName} for ${input.childName}`, html, { replyTo: input.parentEmail });
}

export async function sendBookingAutoReply(input: BookingEmailInput): Promise<boolean> {
  const amount = amountLabel(input);
  const html = wrapEmail(
    `You're booked in, ${input.parentName.split(' ')[0]}!`,
    `<p>Thanks for booking <strong>${input.activityName}</strong> for ${input.childName}. Here are the details:</p>
     ${fieldRows([
       ['Activity', input.activityName],
       ['Date', input.date],
       ['Time', input.time],
       ['Location', 'Selong Bay School campus, Selong Belanak'],
       ['Payment method', paymentMethodLabels[input.paymentMethod]],
       ['Amount due', amount],
     ])}
     ${input.paymentMethod === 'pay_online'
       ? `${bankDetailsHtml()}<p style="margin-top: 16px;">Please complete the transfer before your session. We'll confirm once we've received it.</p>`
       : input.paymentMethod === 'pack_session'
         ? `<p style="margin-top: 16px;">This session is included in your activity pack. No payment needed.</p>`
         : `<p style="margin-top: 16px;">You can pay in person when you arrive for the session.</p>`
     }
     <p style="margin-top: 16px;">If your plans change, just reply to this email or call us on ${siteConfig.contact.phone}.</p>
     <p style="margin-top: 24px;">See you soon!<br />The Selong Bay School team</p>`
  );
  return send(input.parentEmail, `Booking confirmed: ${input.activityName}`, html, { cc: NOTIFY_TO });
}

export interface PassEmailInput {
  childName: string;
  customerName: string;
  customerEmail: string;
  totalSessions: number;
  priceIDR: number;
  expiresAt: string;
  paymentMethod: PaymentMethod;
}

export async function sendPassNotification(input: PassEmailInput): Promise<boolean> {
  const html = wrapEmail(
    'New Activity Pack Purchase',
    fieldRows([
      ["Child's name", input.childName],
      ['Customer', `${input.customerName} (${input.customerEmail})`],
      ['Sessions', String(input.totalSessions)],
      ['Amount', formatIDR(input.priceIDR)],
      ['Expires', input.expiresAt],
      ['Payment method', paymentMethodLabels[input.paymentMethod]],
    ]) + (input.paymentMethod === 'pay_online' ? bankDetailsHtml() : '')
  );
  return send(NOTIFY_TO, `Activity pack purchased for ${input.childName}`, html, { replyTo: input.customerEmail });
}

export async function sendPassAutoReply(input: PassEmailInput): Promise<boolean> {
  const html = wrapEmail(
    `Your activity pack is on its way, ${input.customerName.split(' ')[0]}!`,
    `<p>Thanks for buying a ${input.totalSessions}-session activity pack for ${input.childName}. Here are the details:</p>
     ${fieldRows([
       ["Child's name", input.childName],
       ['Sessions', String(input.totalSessions)],
       ['Amount', formatIDR(input.priceIDR)],
       ['Expires', input.expiresAt],
       ['Payment method', paymentMethodLabels[input.paymentMethod]],
     ])}
     ${input.paymentMethod === 'pay_online'
       ? `${bankDetailsHtml()}<p style="margin-top: 16px;">Please complete the transfer soon. We'll confirm your pack once we've received it.</p>`
       : `<p style="margin-top: 16px;">You can pay in person at the school.</p>`
     }
     <p style="margin-top: 16px;">Once confirmed, just choose "Use a session from your pack" when booking any activity for ${input.childName}.</p>
     <p style="margin-top: 24px;">See you soon!<br />The Selong Bay School team</p>`
  );
  return send(input.customerEmail, `Activity pack confirmed for ${input.childName}`, html, { cc: NOTIFY_TO });
}

export interface PassCompletionEmailInput {
  customerName: string;
  customerEmail: string;
  childName: string;
  totalSessions: number;
}

/** Sent once by the daily cron job (src/app/api/cron/passes/route.ts) when a pack's sessions are all used up. */
export async function sendPassCompletionEmail(input: PassCompletionEmailInput): Promise<boolean> {
  const html = wrapEmail(
    `${input.childName}'s activity pack is complete!`,
    `<p>Hi ${input.customerName.split(' ')[0]}, thanks for using all ${input.totalSessions} sessions of ${input.childName}'s activity pack.
       We hope ${input.childName} had a wonderful time!</p>
     <p>Ready for more? You can buy another pack any time.</p>
     <p><a href="${siteConfig.url}/account/buy-pack" style="color:#007c83; font-weight:700;">Buy another activity pack &rarr;</a></p>
     <p style="margin-top: 24px;">See you soon!<br />The Selong Bay School team</p>`
  );
  return send(input.customerEmail, `${input.childName}'s activity pack is complete!`, html);
}

export interface PassExpiryReminderEmailInput {
  customerName: string;
  customerEmail: string;
  childName: string;
  sessionsRemaining: number;
  expiresAt: string;
}

/** Sent once by the daily cron job (src/app/api/cron/passes/route.ts) when a pack is within 7 days of expiring, unless it's already been fully used (sendPassCompletionEmail covers that case instead). */
export async function sendPassExpiryReminderEmail(input: PassExpiryReminderEmailInput): Promise<boolean> {
  const sessionsLabel = `${input.sessionsRemaining} session${input.sessionsRemaining === 1 ? '' : 's'}`;
  const html = wrapEmail(
    `${input.childName}'s activity pack expires soon`,
    `<p>Hi ${input.customerName.split(' ')[0]}, just a heads up: ${input.childName}'s activity pack has ${sessionsLabel} remaining
       and expires on ${input.expiresAt}.</p>
     <p>Book a session soon so you don't miss out.</p>
     <p><a href="${siteConfig.url}/activities" style="color:#007c83; font-weight:700;">Book a session &rarr;</a></p>
     <p style="margin-top: 24px;">See you soon!<br />The Selong Bay School team</p>`
  );
  return send(input.customerEmail, `${input.childName}'s activity pack expires in a week`, html);
}

export interface SessionCancellationEmailInput {
  activityName: string;
  date: string;
  time: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  /** Whether this booking's payment method was pay_online, i.e. they may already have sent a bank transfer. */
  mayHavePaid: boolean;
}

export async function sendSessionCancellationEmail(input: SessionCancellationEmailInput): Promise<boolean> {
  const html = wrapEmail(
    'Your session has been cancelled',
    `<p>Hi ${input.parentName.split(' ')[0]}, we're sorry to let you know that the following session has been cancelled:</p>
     ${fieldRows([
       ['Activity', input.activityName],
       ['Date', input.date],
       ['Time', input.time],
       ["Child's name", input.childName],
     ])}
     ${input.mayHavePaid
       ? `<p style="margin-top: 16px;">If you've already sent payment for this session by bank transfer or Wise, please get in touch and we'll arrange a refund.</p>`
       : ''
     }
     <p style="margin-top: 16px;">Please get in touch and we'll help you find another slot, or answer any questions:
       <a href="mailto:${siteConfig.contact.email}" style="color:#007c83;">${siteConfig.contact.email}</a>
       or ${siteConfig.contact.phone}.</p>
     <p style="margin-top: 24px;">Sorry for the inconvenience,<br />The Selong Bay School team</p>`
  );
  return send(input.parentEmail, `Cancelled: ${input.activityName} on ${input.date}`, html, { cc: NOTIFY_TO });
}

export interface CustomerCancellationConfirmationInput {
  activityName: string;
  date: string;
  time: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  /** Whether this booking's payment method was pay_online, i.e. they may already have paid. */
  mayHavePaid: boolean;
}

/** Sent when a customer cancels their own booking from /account/bookings (as opposed to sendSessionCancellationEmail, sent when an admin cancels the whole session). */
export async function sendCustomerCancellationConfirmation(input: CustomerCancellationConfirmationInput): Promise<boolean> {
  const html = wrapEmail(
    'Your booking has been cancelled',
    `<p>Hi ${input.parentName.split(' ')[0]}, this confirms your booking has been cancelled:</p>
     ${fieldRows([
       ['Activity', input.activityName],
       ['Date', input.date],
       ['Time', input.time],
       ["Child's name", input.childName],
     ])}
     ${input.mayHavePaid
       ? `<p style="margin-top: 16px;">Since you'd already paid for this session, we'll process a refund manually and be in touch shortly to arrange it.</p>`
       : ''
     }
     <p style="margin-top: 16px;">If this was a mistake or you'd like to book another session, just visit the Activities page any time.</p>
     <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(input.parentEmail, `Booking cancelled: ${input.activityName}`, html);
}

export interface CustomerCancellationNotificationInput {
  activityName: string;
  date: string;
  time: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  paymentStatusLabel: string;
}

/** Sent to hello@selongbayschool.com alongside sendCustomerCancellationConfirmation, so the school knows to action a manual refund if payment had already been received. */
export async function sendCustomerCancellationNotification(input: CustomerCancellationNotificationInput): Promise<boolean> {
  const html = wrapEmail(
    'Customer Cancelled a Booking',
    fieldRows([
      ['Activity', input.activityName],
      ['Date', input.date],
      ['Time', input.time],
      ["Child's name", input.childName],
      ['Parent name', input.parentName],
      ['Parent email', input.parentEmail],
      ['Parent phone', input.parentPhone],
      ['Payment status at cancellation', input.paymentStatusLabel],
    ])
  );
  return send(NOTIFY_TO, `Booking cancelled by customer: ${input.activityName} for ${input.childName}`, html, { replyTo: input.parentEmail });
}

export interface InvoiceEmailInput {
  toEmail: string;
  billedToName: string;
  invoiceNumber: number;
  invoiceType: 'tuition' | 'activity';
  totalAmount: number;
  currency: string;
  dueDate: string;
  pdfBuffer: Buffer;
}

/** Sent from the "Send to parent" action on an invoice (Child Card, invoice edit page, or the
 * master invoice list) — cc'd to the school inbox so there's always a record even if the parent's
 * address is wrong, same pattern as every other outbound email in this app. */
export async function sendInvoiceEmail(input: InvoiceEmailInput): Promise<boolean> {
  const amount = input.currency === 'IDR' ? formatIDR(input.totalAmount) : `${input.totalAmount} ${input.currency}`;
  const html = wrapEmail(
    `Invoice #${String(input.invoiceNumber).padStart(3, '0')}`,
    `<p>Dear ${input.billedToName},</p>
     <p>Please find attached your ${input.invoiceType} invoice from Selong Bay School.</p>
     ${fieldRows([
       ['Invoice number', `#${String(input.invoiceNumber).padStart(3, '0')}`],
       ['Amount due', amount],
       ['Due date', input.dueDate],
     ])}
     <p style="margin-top: 16px;">Bank transfer details are included in the attached PDF. If you have any questions, just reply to this email.</p>
     <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(input.toEmail, `Invoice #${String(input.invoiceNumber).padStart(3, '0')} — Selong Bay School`, html, {
    cc: NOTIFY_TO,
    attachment: [{ name: `invoice-${input.invoiceNumber}.pdf`, content: input.pdfBuffer.toString('base64') }],
  });
}

export interface ComplianceFormEmailInput {
  toEmail: string;
  childFullName: string;
  formTitle: string;
  alreadySigned: boolean;
  pdfBuffer: Buffer;
}

/** Sent from the "Send to parent" action on a Forms & Compliance item (Child Card) — cc'd to the
 * school inbox, same pattern as sendInvoiceEmail. Works whether the form has already been signed
 * (parent gets a copy for their records) or not (parent gets it to review/sign and return). */
export async function sendComplianceFormEmail(input: ComplianceFormEmailInput): Promise<boolean> {
  const html = wrapEmail(
    input.formTitle,
    input.alreadySigned
      ? `<p>Dear parent/guardian of ${input.childFullName},</p>
         <p>Please find attached a copy of the signed <strong>${input.formTitle}</strong> on file for ${input.childFullName}.</p>
         <p style="margin-top: 16px;">If you have any questions, just reply to this email.</p>
         <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
      : `<p>Dear parent/guardian of ${input.childFullName},</p>
         <p>Please find attached the <strong>${input.formTitle}</strong> for ${input.childFullName}. This form still needs to be signed and returned to the school office.</p>
         <p style="margin-top: 16px;">If you have any questions, just reply to this email.</p>
         <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(input.toEmail, `${input.formTitle} — ${input.childFullName} — Selong Bay School`, html, {
    cc: NOTIFY_TO,
    attachment: [{ name: `${input.formTitle.replace(/[^a-z0-9]+/gi, '-')}-${input.childFullName.replace(/[^a-z0-9]+/gi, '-')}.pdf`, content: input.pdfBuffer.toString('base64') }],
  });
}

export interface LetterOfOfferEmailInput {
  toEmail: string;
  childFullName: string;
  acceptUrl: string;
  pdfBuffer: Buffer;
}

/** Sent from the "Send to parent" action on a Letter of Offer (Child Card) — cc'd to the school
 * inbox, same pattern as every other outbound document email in this app. The PDF is attached for
 * their records, but acceptance itself happens via acceptUrl (a tokenized public page), not by
 * replying to this email. */
export async function sendLetterOfOfferEmail(input: LetterOfOfferEmailInput): Promise<boolean> {
  const html = wrapEmail(
    'Letter of Offer',
    `<p>Dear parent/guardian of ${input.childFullName},</p>
     <p>Please find attached the Letter of Offer confirming ${input.childFullName}'s place at Selong Bay School.</p>
     <p style="margin-top: 16px;">Please review it and let us know if anything needs correcting. When you're ready,
       accept the offer online here:</p>
     <p style="margin-top: 12px;"><a href="${input.acceptUrl}" style="color:#007c83; font-weight:700;">Review &amp; accept the Letter of Offer</a></p>
     <p style="margin-top: 16px;">Once you've accepted, we'll follow up with the tuition invoice.</p>
     <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(input.toEmail, `Letter of Offer — ${input.childFullName} — Selong Bay School`, html, {
    cc: NOTIFY_TO,
    attachment: [{ name: `letter-of-offer-${input.childFullName.replace(/[^a-z0-9]+/gi, '-')}.pdf`, content: input.pdfBuffer.toString('base64') }],
  });
}

/** Sent to the school inbox the moment a parent accepts a Letter of Offer online — this is the
 * "prompt admin staff to send the invoice" step: an actionable notification with a direct link to
 * create the tuition invoice for this child, rather than acceptance silently updating a status
 * flag that nobody notices. */
export async function sendLetterOfOfferAcceptedNotification(input: {
  childFullName: string;
  acceptedByName: string;
  createInvoiceUrl: string;
}): Promise<boolean> {
  const html = wrapEmail(
    'Letter of Offer accepted',
    `<p>${input.acceptedByName} has accepted the Letter of Offer for <strong>${input.childFullName}</strong>.</p>
     <p style="margin-top: 16px; font-weight: 700;">Next step: send the tuition invoice.</p>
     <p style="margin-top: 12px;"><a href="${input.createInvoiceUrl}" style="color:#007c83; font-weight:700;">Create the tuition invoice</a></p>`
  );
  return send(NOTIFY_TO, `Letter of Offer accepted — ${input.childFullName}`, html);
}

export async function sendLetterOfOfferAcceptedConfirmation(toEmail: string, childFullName: string): Promise<boolean> {
  const html = wrapEmail(
    'Thank you for accepting',
    `<p>Thank you for accepting the Letter of Offer for ${childFullName}. We're delighted to welcome them to Selong Bay School.</p>
     <p style="margin-top: 16px;">We'll be in touch shortly with the tuition invoice. If you have any questions in the meantime, just reply to this email.</p>
     <p style="margin-top: 24px;">Warmly,<br />The Selong Bay School team</p>`
  );
  return send(toEmail, `Thanks for accepting — ${childFullName} — Selong Bay School`, html, { cc: NOTIFY_TO });
}

/** Sent to the school inbox the moment a child's card is dragged into an active status
 * (Full-Time/Temporary/Worldschooler/Hybrid) with start date + programme already confirmed (the
 * same guard rail that gates the drag itself — see checkActiveStatusGuardRail in
 * src/lib/child-lifecycle.ts) and no tuition invoice exists yet. Same "prompt a human with a
 * direct link" shape as sendLetterOfOfferAcceptedNotification's createInvoiceUrl, and for the same
 * reason: total_amount can't be computed automatically (tuition_plan is free text, there's no fee
 * schedule table), so this nudges rather than silently creating a $0 invoice. */
export async function sendChildActivatedInvoicePrompt(input: {
  childFullName: string;
  statusLabel: string;
  createInvoiceUrl: string;
}): Promise<boolean> {
  const html = wrapEmail(
    'Ready for a tuition invoice',
    `<p><strong>${input.childFullName}</strong> just moved to <strong>${input.statusLabel}</strong> with a start date and programme confirmed.</p>
     <p style="margin-top: 16px; font-weight: 700;">Next step: generate the tuition invoice.</p>
     <p style="margin-top: 12px;"><a href="${input.createInvoiceUrl}" style="color:#007c83; font-weight:700;">Open ${input.childFullName}'s card</a></p>`
  );
  return send(NOTIFY_TO, `Ready for a tuition invoice — ${input.childFullName}`, html);
}

export interface ChildProfileFieldChange {
  label: string;
  oldValue: string | null;
  newValue: string | null;
}

/** Sent whenever a parent edits allergies_medical_notes, dietary_requirements, or lunch_option on
 * their own child's profile — these are the fields where stale data going unnoticed is a safety
 * risk, so the edit is pushed to people rather than only showing up next time someone opens the
 * card. Goes to the school inbox and every teacher assigned to the child's class (the same people
 * who can already see these fields on the admin Child Card today — this doesn't expose anything
 * new, it just makes sure they actually see the change). send() only takes one "to" address at a
 * time, so this loops rather than extending it for a one-off multi-recipient case. */
export async function sendChildProfileEditNotification(input: {
  childFullName: string;
  editedByLabel: string;
  changes: ChildProfileFieldChange[];
  teacherEmails: string[];
}): Promise<boolean> {
  const html = wrapEmail(
    'Child profile updated',
    `<p>${input.editedByLabel} updated the following for <strong>${input.childFullName}</strong>:</p>
     ${fieldRows(
       input.changes.map((c) => [c.label, `${c.oldValue || '(none)'} → ${c.newValue || '(none)'}`])
     )}
     <p style="margin-top: 16px;">Please review this in the Child Card if anything looks like it needs follow-up.</p>`
  );
  const subject = `Profile updated — ${input.childFullName} — Selong Bay School`;
  const recipients = [NOTIFY_TO, ...input.teacherEmails.filter((e) => e !== NOTIFY_TO)];
  const results = await Promise.all(recipients.map((to) => send(to, subject, html)));
  return results.every(Boolean);
}
