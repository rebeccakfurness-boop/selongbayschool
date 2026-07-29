import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { formatDate } from '@/lib/admin-format';
import { ENQUIRY_SOURCE_LABELS } from '@/lib/family-data';
import { getCurrentStaff } from '@/lib/current-staff';
import FamiliesTabs from '@/components/admin/FamiliesTabs';
import ConvertEnquiryButton from '@/components/admin/ConvertEnquiryButton';

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
  converted_child_name: string | null;
}

export default async function AdmissionsEnquiriesPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const enquiries = (await sql`
    SELECT ae.id, ae.source, ae.parent_name, ae.child_name, ae.child_age, ae.contact_phone, ae.contact_email,
           ae.plan_to_stay, ae.first_message_date, ae.follow_up_notes, ae.converted_child_id,
           c.child_full_name AS converted_child_name
    FROM admissions_enquiries ae
    LEFT JOIN children c ON c.id = ae.converted_child_id
    ORDER BY ae.first_message_date DESC NULLS LAST, ae.id DESC
  `) as unknown as EnquiryRow[];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Admissions Pipeline</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            {enquiries.length} leads imported from School Tours, WhatsApp, Old Inquiries, Other Islanders, and
            Visitor logs. &quot;Visitor&quot; entries include some non-family visits (teacher applicants, training) —
            review and archive as needed. {staff.role === 'admin' ? 'Convert a lead once it\'s ready for a Family record — the original lead stays on file, just marked converted.' : ''}
          </p>
        </div>
        <FamiliesTabs active="enquiries" role={staff.role} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">First contact</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Source</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Parent</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Contact</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Plan to stay</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Notes</th>
              {staff.role === 'admin' && <th className="px-4 py-3 font-bold text-ink-soft">Family record</th>}
            </tr>
          </thead>
          <tbody>
            {enquiries.map((row) => (
              <tr key={row.id} className={`border-b border-sand-line/60 last:border-0 align-top ${row.converted_child_id ? 'opacity-60' : ''}`}>
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
                {staff.role === 'admin' && (
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.converted_child_id ? (
                      <Link href={`/admin/families/${row.converted_child_id}`} className="text-xs font-semibold text-teal-deep underline">
                        Converted — {row.converted_child_name}
                      </Link>
                    ) : (
                      <ConvertEnquiryButton
                        enquiryId={row.id}
                        prefill={{
                          childFullName: row.child_name || '',
                          parent1Name: row.parent_name || '',
                          primaryContactEmail: row.contact_email || '',
                          primaryContactPhone: row.contact_phone || '',
                        }}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={staff.role === 'admin' ? 8 : 7} className="px-4 py-6 text-center text-ink-soft">
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
