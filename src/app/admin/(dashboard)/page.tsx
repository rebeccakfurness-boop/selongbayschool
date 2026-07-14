import { ensureSchema, sql } from '@/lib/db';

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
  created_at: string;
}

interface BookingRow {
  id: number;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  child_name: string;
  child_age: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  emergency_contact: string;
  notify_email_status: string;
  reply_email_status: string;
  created_at: string;
}

function StatusPill({ status }: { status: string }) {
  const sent = status === 'sent';
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
        sent ? 'bg-teal/15 text-teal-deep' : 'bg-orange/20 text-orange-deep'
      }`}
    >
      {sent ? 'Email sent' : 'Email failed'}
    </span>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminSubmissionsPage() {
  await ensureSchema();
  const enquiries = (await sql`
    SELECT id, type, name, email, phone, message, child_name, child_age, interest,
           notify_email_status, reply_email_status, created_at
    FROM enquiries ORDER BY created_at DESC LIMIT 200
  `) as unknown as EnquiryRow[];

  const bookings = (await sql`
    SELECT b.id, b.activity_name, s.session_date::text AS slot_date, s.session_time AS slot_time, b.child_name, b.child_age,
           b.parent_name, b.parent_email, b.parent_phone, b.emergency_contact,
           b.notify_email_status, b.reply_email_status, b.created_at
    FROM bookings b
    JOIN sessions s ON s.id = b.slot_id
    ORDER BY b.created_at DESC LIMIT 200
  `) as unknown as BookingRow[];

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Enquiries</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {enquiries.length} total &middot; contact, admissions, and high school enquiries.
        </p>
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Received</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Name</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Contact</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Child / Interest</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Message</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((row) => (
                <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top">
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
                    <div><StatusPill status={row.notify_email_status} /></div>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No enquiries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Activity bookings</h1>
        <p className="mt-1 text-sm text-ink-soft">{bookings.length} total.</p>
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Booked</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Activity</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Date &amp; time</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Parent</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Emergency contact</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((row) => (
                <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.activity_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{row.slot_date} &middot; {row.slot_time}</td>
                  <td className="px-4 py-3 text-ink-soft">{row.child_name} ({row.child_age})</td>
                  <td className="px-4 py-3 text-ink-soft">
                    <div>{row.parent_name}</div>
                    <div>{row.parent_email}</div>
                    <div>{row.parent_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{row.emergency_contact}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusPill status={row.notify_email_status} />
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No bookings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
