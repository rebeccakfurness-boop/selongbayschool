import { ensureSchema, sql } from '@/lib/db';
import { formatDate } from '@/lib/admin-format';
import { ENQUIRY_SOURCE_LABELS } from '@/lib/family-data';

export const dynamic = 'force-dynamic';

interface EnquiryRow {
  id: number;
  source: string;
  parent_name: string | null;
  child_name: string | null;
  child_age: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  plan_to_stay: string | null;
  first_message_date: string | null;
  follow_up_notes: string | null;
  converted_child_id: number | null;
}

export default async function AdmissionsEnquiriesPage() {
  await ensureSchema();
  const enquiries = (await sql`
    SELECT id, source, parent_name, child_name, child_age, contact_phone, contact_email,
           plan_to_stay, first_message_date, follow_up_notes, converted_child_id
    FROM admissions_enquiries
    ORDER BY first_message_date DESC NULLS LAST, id DESC
  `) as unknown as EnquiryRow[];

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Admissions Pipeline</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        {enquiries.length} leads imported from School Tours, WhatsApp, Old Inquiries, Other Islanders, and Visitor
        logs. &quot;Visitor&quot; entries include some non-family visits (teacher applicants, training) — review and
        archive as needed. Converting a lead into a full Family record lands in Phase 2.
      </p>
      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">First contact</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Source</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Parent</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Contact</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Plan to stay</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Notes</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((row) => (
              <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {row.first_message_date ? formatDate(row.first_message_date) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-bold text-teal-deep">
                    {ENQUIRY_SOURCE_LABELS[row.source] || row.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">{row.parent_name || '—'}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {row.child_name || '—'}
                  {row.child_age ? ` (${row.child_age})` : ''}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {row.contact_email && <div>{row.contact_email}</div>}
                  {row.contact_phone && <div>{row.contact_phone}</div>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{row.plan_to_stay || '—'}</td>
                <td className="max-w-xs px-4 py-3 text-ink-soft">{row.follow_up_notes || '—'}</td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">
                  No leads imported yet — run <code>npm run db:import-family</code> with the enrollment spreadsheet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
