import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { formatDate } from '@/lib/admin-format';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import AddLibraryDiscountCodeForm from '@/components/admin/AddLibraryDiscountCodeForm';
import LibraryDiscountCodeActions from '@/components/admin/LibraryDiscountCodeActions';

export const dynamic = 'force-dynamic';

interface DiscountCodeRow {
  id: number;
  code: string;
  description: string | null;
  discount_percent: number;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  is_active: boolean;
}

export default async function AdminLibraryDiscountCodesPage() {
  await requireAdmin();
  await ensureSchema();

  const codes = (await sql`
    SELECT id, code, description, discount_percent, max_redemptions, times_redeemed, expires_at::text, is_active
    FROM library_discount_codes ORDER BY created_at DESC
  `) as unknown as DiscountCodeRow[];

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Library Discount Codes</h1>
      <p className="mt-1 text-sm text-ink-soft">Give long-term families free or discounted library membership.</p>
      <LibrarySubNav active="/admin/library/discount-codes" isAdmin={true} />

      <div className="mt-4">
        <AddLibraryDiscountCodeForm />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Code</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Discount</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Redeemed</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Expires</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-mono font-semibold text-ink">{c.code}</div>
                  {c.description && <div className="text-xs text-ink-soft">{c.description}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{c.discount_percent}% off</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {c.times_redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ''}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.is_active ? 'bg-teal/15 text-teal-deep' : 'bg-black/10 text-ink-soft'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <LibraryDiscountCodeActions codeId={c.id} isActive={c.is_active} />
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">No discount codes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
