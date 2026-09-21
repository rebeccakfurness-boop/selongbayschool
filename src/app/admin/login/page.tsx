import { cookies } from 'next/headers';
import { ensureSchema, sql } from '@/lib/db';
import { ADMIN_DEVICE_COOKIE_NAME, sanitizeNextPath } from '@/lib/auth';
import { peekDeviceToken } from '@/lib/device-trust';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import ContinueAsCard from '@/components/account/ContinueAsCard';

export const dynamic = 'force-dynamic';

/** Server Component: checks the device-trust cookie and, if it's valid, shows "Continue as
 * [name]?" instead of the password form — same pattern as /account/login, extended to staff so a
 * teacher/admin isn't stuck re-typing a password every time the 12-hour session cookie expires. */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: nextParam } = await searchParams;
  const next = sanitizeNextPath(nextParam, '/admin');

  const deviceToken = (await cookies()).get(ADMIN_DEVICE_COOKIE_NAME)?.value;
  let continueAsLabel: string | null = null;

  if (deviceToken) {
    await ensureSchema();
    const peeked = await peekDeviceToken('admin', deviceToken);
    if (peeked) {
      const rows = await sql`SELECT display_name, email FROM admin_users WHERE id = ${peeked.accountId}`;
      const user = rows[0];
      if (user) {
        continueAsLabel = (user.display_name as string | null) || (user.email as string);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      {continueAsLabel ? (
        <ContinueAsCard
          title="Welcome back"
          label={continueAsLabel}
          continueHref={`/api/admin/device-login?next=${encodeURIComponent(next)}&from=${encodeURIComponent('/admin/login')}`}
          forgetHref={`/api/admin/device-login/forget?next=${encodeURIComponent(next)}&from=${encodeURIComponent('/admin/login')}`}
        />
      ) : (
        <AdminLoginForm />
      )}
    </div>
  );
}
