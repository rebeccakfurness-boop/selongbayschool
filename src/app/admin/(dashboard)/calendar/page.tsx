import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import CalendarConnectionManager from '@/components/admin/CalendarConnectionManager';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: 'That connection attempt looked invalid (state mismatch) — please try connecting again.',
  not_configured: 'GOOGLE_CALENDAR_CLIENT_ID/SECRET/REDIRECT_URI are not set in this environment yet.',
  token_exchange_failed: 'Google rejected the connection request. Check the redirect URI matches what’s configured in Google Cloud Console.',
  no_refresh_token: 'Google did not return a refresh token. Try disconnecting any prior authorization for this app in your Google Account’s security settings, then reconnect.',
  unexpected: 'Something went wrong connecting to Google Calendar. Please try again.',
};

/** Renders inline instead of throwing up to the site-wide error boundary (src/app/error.tsx),
 * which strips the real message from what reaches the browser in production — same pattern as
 * BoardLoadError on the Family Board list page. */
function CalendarPageLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Meeting Calendar</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">
          This is usually a database schema mismatch rather than something wrong with your data. Please share this
          message so it can be fixed:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </section>
  );
}

export default async function CalendarConnectionPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  try {
    await requireAdmin();
    await ensureSchema();
    const { connected, error } = await searchParams;

    const [connection] = (await sql`
      SELECT google_account_email FROM calendar_connection WHERE id = 1
    `) as unknown as { google_account_email: string }[];

    return renderCalendarPage(connected, error, connection);
  } catch (error) {
    // redirect() (used by requireAdmin() for non-admins) throws a special error identified by
    // digest — must be rethrown, not swallowed as a normal failure, or navigation breaks silently.
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[admin/calendar] Meeting Calendar page failed to load', error);
    return <CalendarPageLoadError error={error} />;
  }
}

function renderCalendarPage(connected: string | undefined, error: string | undefined, connection: { google_account_email: string } | undefined) {
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Meeting Calendar</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Connects the school&apos;s Google Calendar so &quot;Schedule a meeting&quot; on a Letter of Offer can offer
        parents real open times and create the event (with a Google Meet link for video calls) automatically once
        they pick one.
      </p>

      {connected && (
        <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-4 py-3 text-sm font-semibold text-teal-deep">
          Connected to Google Calendar.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-deep">
          {ERROR_MESSAGES[error] || 'Something went wrong.'}
        </p>
      )}

      <div className="mt-6">
        {connection ? (
          <CalendarConnectionManager connectionEmail={connection.google_account_email} />
        ) : (
          <div className="rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">Not connected yet.</p>
            <a
              href="/api/admin/calendar/connect"
              className="mt-4 inline-block rounded-full bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-deep"
            >
              Connect Google Calendar
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
