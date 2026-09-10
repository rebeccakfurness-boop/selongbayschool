import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime, formatDate } from '@/lib/admin-format';
import StatusPill from '@/components/admin/StatusPill';
import LinkEnrolmentButton from '@/components/admin/LinkEnrolmentButton';

export const dynamic = 'force-dynamic';

interface EnrolmentRow {
  id: number;
  student_name: string;
  student_dob: string;
  start_date: string;
  parent_name: string;
  parent_email: string;
  parent_whatsapp: string;
  notify_email_status: string;
  is_read: boolean;
  created_at: string;
  linked_child_id: number | null;
  linked_child_name: string | null;
}

export default async function AdminEnrolmentsPage() {
  await ensureSchema();
  const enrolments = (await sql`
    SELECT e.id, e.student_name, e.student_dob::text AS student_dob, e.start_date::text AS start_date,
           e.parent_name, e.parent_email, e.parent_whatsapp, e.notify_email_status, e.is_read, e.created_at,
           e.linked_child_id, c.child_full_name AS linked_child_name
    FROM enrolment_submissions e
    LEFT JOIN children c ON c.id = e.linked_child_id
    ORDER BY e.created_at DESC LIMIT 200
  `) as unknown as EnrolmentRow[];

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Enrolments</h1>
      <p className="mt-1 text-sm text-ink-soft">{enrolments.length} total student enrolment submissions.</p>
      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Received</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Student</th>
              <th className="px-4 py-3 font-bold text-ink-soft">DOB</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Start date</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Parent / guardian</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Family card</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {enrolments.map((row) => (
              <tr key={row.id} className={`border-b border-sand-line/60 last:border-0 align-top ${row.is_read ? '' : 'bg-orange/5'}`}>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                <td className="px-4 py-3 font-semibold text-ink">{row.student_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(row.student_dob)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(row.start_date)}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <div>{row.parent_name}</div>
                  <div>{row.parent_email}</div>
                  <div>{row.parent_whatsapp}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusPill status={row.notify_email_status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.linked_child_id ? (
                    <Link href={`/admin/families/${row.linked_child_id}`} className="text-sm font-semibold text-teal-deep hover:underline">
                      {row.linked_child_name || 'View card'} →
                    </Link>
                  ) : (
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">Not linked</span>
                      <LinkEnrolmentButton enrolmentId={row.id} />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/admin/enrolments/${row.id}`} className="text-sm font-semibold text-teal-deep hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {enrolments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-soft">No enrolment submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
