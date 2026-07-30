import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import ClassroomManager from '@/components/admin/ClassroomManager';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: 'That connection attempt looked invalid (state mismatch) — please try connecting again.',
  not_configured: 'GOOGLE_CLASSROOM_CLIENT_ID/SECRET/REDIRECT_URI are not set in this environment yet.',
  token_exchange_failed: 'Google rejected the connection request. Check the redirect URI matches what’s configured in Google Cloud Console.',
  no_refresh_token: 'Google did not return a refresh token. Try disconnecting any prior authorization for this app in your Google Account’s security settings, then reconnect.',
  unexpected: 'Something went wrong connecting to Google Classroom. Please try again.',
};

export default async function ClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  await requireAdmin();
  await ensureSchema();
  const { connected, error } = await searchParams;

  const [connection] = (await sql`
    SELECT google_account_email, last_synced_at::text FROM classroom_connection WHERE id = 1
  `) as unknown as { google_account_email: string; last_synced_at: string | null }[];

  const mappings = (await sql`
    SELECT google_course_id, google_course_name, class_name FROM classroom_course_mappings ORDER BY class_name
  `) as unknown as { google_course_id: string; google_course_name: string; class_name: string }[];

  const classOptions = ((await sql`
    SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name
  `) as unknown as { class_name: string }[]).map((r) => r.class_name);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Google Classroom</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Syncs class rosters, assignments, and submission references into the app. Assignments show up alongside
        lesson plans on the parent and student portals; submissions link from the Child Card once a course is
        mapped and synced.
      </p>

      {connected && (
        <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-4 py-3 text-sm font-semibold text-teal-deep">
          Connected to Google Classroom.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-deep">
          {ERROR_MESSAGES[error] || 'Something went wrong.'}
        </p>
      )}

      <div className="mt-6">
        {connection ? (
          <ClassroomManager
            connectionEmail={connection.google_account_email}
            lastSyncedAt={connection.last_synced_at}
            initialMappings={mappings}
            classOptions={classOptions}
          />
        ) : (
          <div className="rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">Not connected yet.</p>
            <a
              href="/api/admin/classroom/connect"
              className="mt-4 inline-block rounded-full bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-deep"
            >
              Connect Google Classroom
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
