import { cookies } from 'next/headers';
import { ensureSchema, sql } from '@/lib/db';
import { STUDENT_DEVICE_COOKIE_NAME, sanitizeNextPath } from '@/lib/auth';
import { peekDeviceToken } from '@/lib/device-trust';
import StudentLoginForm from '@/components/account/StudentLoginForm';
import ContinueAsCard from '@/components/account/ContinueAsCard';

export const dynamic = 'force-dynamic';

/** Same "Continue as [name]?" pattern as /account/login — see that page's comment for why this
 * is a confirmation rather than a silent redirect. It matters even more here: a family or
 * classroom computer easily has more than one child using it, and this is what stops one child's
 * remembered login from being silently used to sign in as them when a different child sits down. */
export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextParam } = await searchParams;
  const next = sanitizeNextPath(nextParam, '/student');

  const deviceToken = (await cookies()).get(STUDENT_DEVICE_COOKIE_NAME)?.value;
  let continueAsLabel: string | null = null;

  if (deviceToken) {
    await ensureSchema();
    const peeked = await peekDeviceToken('student', deviceToken);
    if (peeked) {
      const rows = await sql`
        SELECT COALESCE(c.child_nickname, c.child_full_name) AS label
        FROM student_accounts sa JOIN children c ON c.id = sa.child_id
        WHERE sa.id = ${peeked.accountId}
      `;
      const row = rows[0];
      if (row) {
        continueAsLabel = row.label as string;
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
      {continueAsLabel ? (
        <ContinueAsCard
          title="Welcome back"
          label={continueAsLabel}
          continueHref={`/api/student/device-login?next=${encodeURIComponent(next)}`}
          forgetHref={`/api/student/device-login/forget?next=${encodeURIComponent(next)}`}
        />
      ) : (
        <StudentLoginForm />
      )}
    </div>
  );
}
