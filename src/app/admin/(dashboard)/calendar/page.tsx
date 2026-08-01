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

export default async function CalendarConnectionPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  await requireAdmin();
  await ensureSchema();
  const { connected, error } = await searchParams;

  const [connection] = (await sql`
    SELECT google_account_email FROM calendar_connection WHERE id = 1
  `) as unknown as { google_account_email: string }[];

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
