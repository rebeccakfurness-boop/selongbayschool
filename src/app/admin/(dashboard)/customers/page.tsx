import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';

interface CustomerRow {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
  booking_count: number;
  pass_count: number;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await ensureSchema();
  const { q } = await searchParams;
  const query = q?.trim() || null;

  const customers = (await sql`
    SELECT c.id, c.name, c.email, c.phone, c.created_at, c.last_login_at,
           COALESCE(b.count, 0) AS booking_count,
           COALESCE(p.count, 0) AS pass_count
    FROM customers c
    LEFT JOIN (
      SELECT customer_id, COUNT(*)::int AS count FROM bookings
      WHERE customer_id IS NOT NULL AND status != 'cancelled'
      GROUP BY customer_id
    ) b ON b.customer_id = c.id
    LEFT JOIN (
      SELECT customer_id, COUNT(*)::int AS count FROM passes GROUP BY customer_id
    ) p ON p.customer_id = c.id
    WHERE (
      ${query}::text IS NULL
      OR c.name ILIKE '%' || ${query} || '%'
      OR c.email ILIKE '%' || ${query} || '%'
      OR c.phone ILIKE '%' || ${query} || '%'
    )
    ORDER BY c.created_at DESC
    LIMIT 200
  `) as unknown as CustomerRow[];

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Parent Accounts</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Every parent portal account, their bookings, and when they last logged in. {customers.length} shown.
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="customers-q" className="text-xs font-bold text-ink-soft">Search</label>
          <input
            id="customers-q"
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Name, email, or phone"
            className="w-64 rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep"
        >
          Search
        </button>
        {q && (
          <Link href="/admin/customers" className="text-sm font-semibold text-ink-soft hover:underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Name</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Email</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Phone</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Joined</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Last login</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Bookings</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Passes</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((row) => (
              <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top hover:bg-sand/20">
                <td className="px-4 py-3 font-semibold text-ink">
                  <Link href={`/admin/customers/${row.id}`} className="text-teal-deep hover:underline">
                    {row.name || 'Unnamed parent'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{row.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{row.phone || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {row.last_login_at ? formatDateTime(row.last_login_at) : 'Never'}
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{row.booking_count}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{row.pass_count}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No parent accounts match this search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
