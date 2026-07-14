import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime } from '@/lib/admin-format';
import StatusPill from '@/components/admin/StatusPill';
import MarkReadButton from '@/components/admin/MarkReadButton';

export const dynamic = 'force-dynamic';

interface EnquiryRow {
  id: number;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  child_name: string | null;
  child_age: string | null;
  interest: string | null;
  notify_email_status: string;
  reply_email_status: string;
  is_read: boolean;
  created_at: string;
}

export default async function AdminEnquiriesPage() {
  await ensureSchema();
  const enquiries = (await sql`
    SELECT id, type, name, email, phone, message, child_name, child_age, interest,
           notify_email_status, reply_email_status, is_read, created_at
    FROM enquiries ORDER BY created_at DESC LIMIT 200
  `) as unknown as EnquiryRow[];

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Enquiries</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {enquiries.length} total &middot; contact, admissions, and high school enquiries.
      </p>
      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Received</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Name</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Contact</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Child / Interest</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Message</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Read</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((row) => (
              <tr key={row.id} className={`border-b border-sand-line/60 last:border-0 align-top ${row.is_read ? '' : 'bg-orange/5'}`}>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold capitalize text-ink">{row.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-ink">{row.name}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <div>{row.email}</div>
                  {row.phone && <div>{row.phone}</div>}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {row.child_name && <div>{row.child_name}{row.child_age ? ` (${row.child_age})` : ''}</div>}
                  {row.interest && <div>{row.interest}</div>}
                </td>
                <td className="max-w-xs px-4 py-3 text-ink-soft">{row.message}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusPill status={row.notify_email_status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <MarkReadButton id={row.id} isRead={row.is_read} />
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-soft">No enquiries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
