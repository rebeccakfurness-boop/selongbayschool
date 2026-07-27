import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime, formatDate } from '@/lib/admin-format';
import { enrolmentLengthLabels, kitasStatusLabels, lunchOptionLabels } from '@/lib/email';
import StatusPill from '@/components/admin/StatusPill';
import MarkReadButton from '@/components/admin/MarkReadButton';

export const dynamic = 'force-dynamic';

interface EnrolmentDetail {
  id: number;
  student_name: string;
  student_dob: string;
  previous_school: string | null;
  previous_grade: string | null;
  siblings_attending: string | null;
  start_date: string;
  enrolment_length: keyof typeof enrolmentLengthLabels;
  enrolment_length_other: string | null;
  kitas_status: keyof typeof kitasStatusLabels;
  kitas_notes: string | null;
  passport_number: string | null;
  passport_nationality: string | null;
  passport_expiry: string | null;
  photography_consent: boolean;
  medical_conditions: string | null;
  allergies: string | null;
  lunch_option: keyof typeof lunchOptionLabels;
  lunch_other_notes: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  authorized_pickup: string | null;
  parent_name: string;
  parent_email: string;
  parent_whatsapp: string;
  is_read: boolean;
  notify_email_status: string;
  reply_email_status: string;
  created_at: string;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-teal-deep">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-[15px] text-ink">{value}</dd>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-6">
      <h2 className="font-display text-base font-semibold text-ink">{heading}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

export default async function AdminEnrolmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enrolmentId = Number(id);
  if (!Number.isInteger(enrolmentId)) notFound();

  await ensureSchema();
  const rows = (await sql`
    SELECT id, student_name, student_dob::text AS student_dob, previous_school, previous_grade, siblings_attending,
           start_date::text AS start_date, enrolment_length, enrolment_length_other,
           kitas_status, kitas_notes, passport_number, passport_nationality, passport_expiry::text AS passport_expiry,
           photography_consent, medical_conditions, allergies,
           lunch_option, lunch_other_notes,
           emergency_contact_name, emergency_contact_phone, authorized_pickup,
           parent_name, parent_email, parent_whatsapp,
           is_read, notify_email_status, reply_email_status, created_at
    FROM enrolment_submissions WHERE id = ${enrolmentId}
  `) as unknown as EnrolmentDetail[];

  if (rows.length === 0) notFound();
  const enrolment = rows[0];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/enrolments" className="text-sm font-semibold text-teal-deep hover:underline">
            &larr; Back to Enrolments
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{enrolment.student_name}</h1>
          <p className="mt-1 text-sm text-ink-soft">Submitted {formatDateTime(enrolment.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={enrolment.notify_email_status} />
          <MarkReadButton id={enrolment.id} isRead={enrolment.is_read} endpoint="/api/admin/enrolments" />
        </div>
      </div>

      <Section heading="Student details">
        <Row label="Student's name" value={enrolment.student_name} />
        <Row label="Date of birth" value={formatDate(enrolment.student_dob)} />
        <Row label="Previous school" value={enrolment.previous_school} />
        <Row label="Previous grade" value={enrolment.previous_grade} />
        <Row label="Siblings attending" value={enrolment.siblings_attending} />
      </Section>

      <Section heading="Enrolment details">
        <Row label="Start date" value={formatDate(enrolment.start_date)} />
        <Row
          label="Length of enrolment"
          value={
            enrolment.enrolment_length === 'other'
              ? [enrolmentLengthLabels.other, enrolment.enrolment_length_other].filter(Boolean).join(': ')
              : enrolmentLengthLabels[enrolment.enrolment_length]
          }
        />
      </Section>

      <Section heading="KITAS &amp; passport">
        <Row label="KITAS status" value={kitasStatusLabels[enrolment.kitas_status]} />
        <Row label="KITAS notes" value={enrolment.kitas_notes} />
        <Row label="Passport number" value={enrolment.passport_number} />
        <Row label="Passport nationality" value={enrolment.passport_nationality} />
        <Row label="Passport expiry" value={enrolment.passport_expiry ? formatDate(enrolment.passport_expiry) : null} />
      </Section>

      <Section heading="Consent &amp; health">
        <Row label="Photography consent" value={enrolment.photography_consent ? 'Yes' : 'No'} />
        <Row label="Medical conditions" value={enrolment.medical_conditions} />
        <Row label="Allergies" value={enrolment.allergies} />
      </Section>

      <Section heading="Lunch">
        <Row
          label="Lunch option"
          value={
            enrolment.lunch_option === 'other'
              ? [lunchOptionLabels.other, enrolment.lunch_other_notes].filter(Boolean).join(': ')
              : lunchOptionLabels[enrolment.lunch_option]
          }
        />
      </Section>

      <Section heading="Emergency contact &amp; authorised pickup">
        <Row label="Emergency contact name" value={enrolment.emergency_contact_name} />
        <Row label="Emergency contact phone" value={enrolment.emergency_contact_phone} />
        <Row label="Other authorised pickup/drop-off" value={enrolment.authorized_pickup} />
      </Section>

      <Section heading="Parent / guardian (invoicing &amp; portal login)">
        <Row label="Name" value={enrolment.parent_name} />
        <Row label="Email" value={enrolment.parent_email} />
        <Row label="WhatsApp" value={enrolment.parent_whatsapp} />
      </Section>
    </section>
  );
}
