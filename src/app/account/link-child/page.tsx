import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema, sql } from '@/lib/db';
import AccountNav from '@/components/account/AccountNav';
import LinkChildForm from '@/components/account/LinkChildForm';

export const dynamic = 'force-dynamic';

interface PendingRequestRow {
  child_full_name: string;
  requested_at: string;
}

export default async function LinkChildPage() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  const customerId = session.customerId;

  await ensureSchema();
  const pending = customerId
    ? ((await sql`
        SELECT c.child_full_name, gc.requested_at::text
        FROM guardian_children gc
        JOIN children c ON c.id = gc.child_id
        WHERE gc.customer_id = ${customerId} AND gc.status = 'pending'
        ORDER BY gc.requested_at DESC
      `) as unknown as PendingRequestRow[])
    : [];

  return (
    <div className="min-h-screen bg-cream">
      <AccountNav />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Link a Child</h1>
        <p className="mt-1 text-sm text-ink-soft">Request to link one of your children to this account.</p>

        {pending.length > 0 && (
          <div className="mt-6 rounded-md border border-sand-line bg-paper p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Pending requests</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
              {pending.map((p, i) => (
                <li key={i}>{p.child_full_name}: awaiting school office review</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <LinkChildForm />
        </div>
      </div>
    </div>
  );
}
