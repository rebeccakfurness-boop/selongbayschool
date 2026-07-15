import { Resend } from 'resend';
import { siteConfig, bankTransferDetails, formatIDR } from './site-content';

const NOTIFY_TO = siteConfig.contact.email;

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'Selong Bay School <onboarding@resend.dev>';
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(apiKey);
}

function wrapEmail(title: string, bodyHtml: string): string {
  const logoUrl = `${siteConfig.url}/images/logo-full.png`;
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #fffdf8;">
    <div style="background: #007c83; padding: 20px 28px;">
      <img src="${logoUrl}" alt="Selong Bay School" width="72" height="57" style="display: block; border: 0;" />
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

async function send(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error('[email] Resend returned an error', { to, subject, error });
      return false;
    }
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
  return send(NOTIFY_TO, `New Enquiry (${source}): ${input.name}`, html, input.email);
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
  return send(input.email, "Thanks for your enquiry: Selong Bay School", html);
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

export type PaymentMethod = 'pay_online' | 'pay_at_session';

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
  paymentMethod: PaymentMethod;
  priceIDR: number | null;
  priceNote: string | null;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  pay_online: 'Pay online (bank transfer)',
  pay_at_session: 'Pay at the session',
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
  return send(NOTIFY_TO, `Booking: ${input.activityName} for ${input.childName}`, html, input.parentEmail);
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
       : `<p style="margin-top: 16px;">You can pay in person when you arrive for the session.</p>`
     }
     <p style="margin-top: 16px;">If your plans change, just reply to this email or call us on ${siteConfig.contact.phone}.</p>
     <p style="margin-top: 24px;">See you soon!<br />The Selong Bay School team</p>`
  );
  return send(input.parentEmail, `Booking confirmed: ${input.activityName}`, html);
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
  return send(input.parentEmail, `Cancelled: ${input.activityName} on ${input.date}`, html);
}
