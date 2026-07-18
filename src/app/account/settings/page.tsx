import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import LogoutButton from '@/components/account/LogoutButton';
import AccountSettingsForm from '@/components/account/AccountSettingsForm';

export const dynamic = 'force-dynamic';

interface CustomerRow {
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export default async function AccountSettingsPage() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    redirect('/account/login?next=/account/settings');
  }

  await ensureSchema();
  const rows = (await sql`
    SELECT emergency_contact_name, emergency_contact_phone FROM customers WHERE id = ${session.customerId}
  `) as unknown as CustomerRow[];
  const customer = rows[0];

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-black/10 bg-teal-deep">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold text-white">My Account</span>
          <div className="flex items-center gap-4">
            <Link href="/account/bookings" className="text-sm font-semibold text-white/90 hover:underline">
              My Bookings
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Account Settings</h1>
          <p className="mt-1 text-sm text-ink-soft">Signed in as {session.email}.</p>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Emergency Contact</h2>
          <p className="mt-1 text-sm text-ink-soft">
            These details are pre-filled whenever you book an activity, so you don&apos;t have to enter them every time.
          </p>
          <AccountSettingsForm
            emergencyContactName={customer?.emergency_contact_name || ''}
            emergencyContactPhone={customer?.emergency_contact_phone || ''}
          />
        </section>
      </div>
    </div>
  );
}
