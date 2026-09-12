import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { formatDate } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import LibraryMembershipEditor from '@/components/admin/LibraryMembershipEditor';
import RunLibraryBillingButton from '@/components/admin/RunLibraryBillingButton';

export const dynamic = 'force-dynamic';

interface MembershipRow {
  id: number;
  customer_id: number;
  status: 'active' | 'cancelled';
  monthly_fee_idr: number;
  discount_percent: number;
  joined_at: string;
  next_billing_date: string;
  customer_name: string | null;
  customer_email: string;
  children_names: string | null;
}

export default async function AdminLibraryMembershipsPage() {
  await requireAdmin();
  await ensureSchema();

  const memberships = (await sql`
    SELECT m.id, m.customer_id, m.status, m.monthly_fee_idr, m.discount_percent,
      m.joined_at::text, m.next_billing_date::text,
      cu.name AS customer_name, cu.email AS customer_email,
      string_agg(DISTINCT COALESCE(c.child_nickname, c.child_full_name), ', ') AS children_names
    FROM library_memberships m
    JOIN customers cu ON cu.id = m.customer_id
    LEFT JOIN guardian_children gc ON gc.customer_id = m.customer_id AND gc.status = 'approved'
    LEFT JOIN children c ON c.id = gc.child_id
    GROUP BY m.id, cu.name, cu.email
    ORDER BY m.joined_at DESC
  `) as unknown as MembershipRow[];

  const activeCount = memberships.filter((m) => m.status === 'active').length;

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Library Memberships</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {memberships.length} total · {activeCount} active. Billed monthly on top of school fees — see Invoices for the library-tagged charges.
      </p>
      <LibrarySubNav active="/admin/library/memberships" isAdmin={true} />

      <div className="mt-4">
        <RunLibraryBillingButton />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Family</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Children</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Joined</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Next billing</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Fee − Discount</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{m.customer_name || m.customer_email}</div>
                  <div className="text-xs text-ink-soft">{m.customer_email}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{m.children_names || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(m.joined_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(m.next_billing_date)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink">{formatIDR(m.monthly_fee_idr)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      m.status === 'active' ? 'bg-teal/15 text-teal-deep' : 'bg-black/10 text-ink-soft'
                    }`}
                  >
                    {m.status === 'active' ? 'Active' : 'Cancelled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <LibraryMembershipEditor
                    membershipId={m.id}
                    monthlyFeeIdr={m.monthly_fee_idr}
                    discountPercent={m.discount_percent}
                    status={m.status}
                  />
                </td>
              </tr>
            ))}
            {memberships.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No families have joined the library yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
