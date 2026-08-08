import { cookies } from 'next/headers';
import { ensureSchema, sql } from '@/lib/db';
import { CUSTOMER_DEVICE_COOKIE_NAME, sanitizeNextPath } from '@/lib/auth';
import { peekDeviceToken } from '@/lib/device-trust';
import MaintenanceNotice from '@/components/MaintenanceNotice';
import AccountLoginForm from '@/components/account/AccountLoginForm';
import ContinueAsCard from '@/components/account/ContinueAsCard';

export const dynamic = 'force-dynamic';

/** Server Component: checks the device-trust cookie and, if it's valid, shows "Continue as
 * [name]?" instead of the magic-link form. Deliberately a confirmation rather than a silent
 * redirect — see peekDeviceToken's comment. Not a plain redirect for another reason too: a
 * Server Component can only read cookies, not set them, so the actual login (which rotates the
 * token and needs to set both a new device cookie and a session cookie) happens in the Route
 * Handler the "Continue" button links to, not here. */
export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: nextParam } = await searchParams;
  const next = sanitizeNextPath(nextParam, '/account');

  const deviceToken = (await cookies()).get(CUSTOMER_DEVICE_COOKIE_NAME)?.value;
  let continueAsLabel: string | null = null;

  if (deviceToken) {
    await ensureSchema();
    const peeked = await peekDeviceToken('customer', deviceToken);
    if (peeked) {
      const rows = await sql`SELECT name, email FROM customers WHERE id = ${peeked.accountId}`;
      const customer = rows[0];
      if (customer) {
        continueAsLabel = (customer.name as string | null) || (customer.email as string);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MaintenanceNotice />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {continueAsLabel ? (
          <ContinueAsCard
            title="Welcome back"
            label={continueAsLabel}
            continueHref={`/api/account/device-login?next=${encodeURIComponent(next)}`}
            forgetHref={`/api/account/device-login/forget?next=${encodeURIComponent(next)}`}
          />
        ) : (
          <AccountLoginForm />
        )}
      </div>
    </div>
  );
}
