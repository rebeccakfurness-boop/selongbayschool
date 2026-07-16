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
  options?: { replyTo?: string; cc?: string }
): Promise<boolean> {
  try {
    const email = new brevo.SendSmtpEmail();
    email.sender = SENDER;
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = html;
    if (options?.replyTo) email.replyTo = { email: options.replyTo };
    if (options?.cc) email.cc = [{ email: options.cc }];

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
  emergencyContact: string;
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
        ['Bank', bankTransferDetails.bank],
        ['Account Number', bankTransferDetails.accountNumber],
        ['Name', bankTransferDetails.accountName],
      ])}
      <p style="margin: 12px 0 0;">
        <a href="${bankTransferDetails.wiseUrl}" style="color:#007c83; font-weight:700;">Or pay via Wise &rarr;</a>
      </p>
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
      ['Emergency contact', input.emergencyContact],
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
