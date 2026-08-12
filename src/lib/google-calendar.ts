import { sql } from './db';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface ConnectionRow {
  calendar_id: string;
  access_token: string;
  access_token_expires_at: string;
  refresh_token: string;
}

export interface BusyPeriod {
  start: string;
  end: string;
}

export interface CreateMeetingEventInput {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmails: string[];
  format: 'in_person' | 'video';
  location: string | null;
}

export interface CreatedMeetingEvent {
  eventId: string;
  meetLink: string | null;
}

async function getConnection(): Promise<ConnectionRow | null> {
  const rows = (await sql`
    SELECT calendar_id, access_token, access_token_expires_at::text, refresh_token
    FROM calendar_connection WHERE id = 1
  `) as unknown as ConnectionRow[];
  return rows[0] || null;
}

export async function isCalendarConnected(): Promise<boolean> {
  return (await getConnection()) !== null;
}

/** The connected account's calendar_id is its own email address (see the comment where
 * calendar_connection is populated) -- its domain is the closest thing this app has to "the
 * school's Workspace domain" without a separate admin-configured setting, used to decide which
 * family members can be added as real Calendar attendees (only those on the school's own domain;
 * everyone else just sees the session/Meet link inside the dashboard itself). */
export async function getWorkspaceDomain(): Promise<string | null> {
  const connection = await getConnection();
  if (!connection) return null;
  const atIndex = connection.calendar_id.indexOf('@');
  return atIndex === -1 ? null : connection.calendar_id.slice(atIndex + 1).toLowerCase();
}

/** Callers should generally check isCalendarConnected() first and surface a clear "connect Google
 * Calendar first" message — this is the fallback for the rare race where it's disconnected between
 * that check and the actual API call. */
async function requireConnection(): Promise<ConnectionRow> {
  const connection = await getConnection();
  if (!connection) {
    throw new Error('Google Calendar is not connected. An admin needs to connect it at /admin/calendar first.');
  }
  return connection;
}

async function getAccessToken(connection: ConnectionRow): Promise<string> {
  const expiresAt = new Date(connection.access_token_expires_at).getTime();
  if (expiresAt > Date.now() + 60_000) {
    return connection.access_token;
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CALENDAR_CLIENT_ID/SECRET not set.');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh Google Calendar access token: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await sql`
    UPDATE calendar_connection SET access_token = ${data.access_token}, access_token_expires_at = ${newExpiresAt}::timestamptz
    WHERE id = 1
  `;
  return data.access_token;
}

/** Plain fetch against Google's REST APIs rather than the `googleapis` package — same rationale as
 * GoogleClassroomProvider: this is ultimately two stable, well-documented REST calls. */
export async function getFreeBusy(timeMinIso: string, timeMaxIso: string): Promise<BusyPeriod[]> {
  const connection = await requireConnection();
  const token = await getAccessToken(connection);
  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      items: [{ id: connection.calendar_id }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Google Calendar freeBusy error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { calendars: Record<string, { busy: BusyPeriod[] }> };
  return data.calendars[connection.calendar_id]?.busy ?? [];
}

/** conferenceDataVersion=1 is required for the `conferenceData.createRequest` block below to
 * actually produce a Google Meet link — omitting it makes Google silently ignore that field.
 * sendUpdates is left at Google's default ('none' behavior for API-created events without it
 * explicitly set to 'all') since the school's own branded confirmation email (see
 * sendMeetingBookedConfirmation in email.ts) is what the parent/staff actually see — a second,
 * generic Google Calendar invite email would just be confusing noise on top of it. */
export async function createMeetingEvent(input: CreateMeetingEventInput): Promise<CreatedMeetingEvent> {
  const connection = await requireConnection();
  const token = await getAccessToken(connection);

  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startIso, timeZone: 'Asia/Makassar' },
    end: { dateTime: input.endIso, timeZone: 'Asia/Makassar' },
    attendees: input.attendeeEmails.map((email) => ({ email })),
  };
  if (input.format === 'video') {
    body.conferenceData = {
      createRequest: {
        requestId: `meeting-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  } else if (input.location) {
    body.location = input.location;
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(connection.calendar_id)}/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`Google Calendar createEvent error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    id: string;
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };
  const meetLink = data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ?? null;
  return { eventId: data.id, meetLink };
}

export interface UpdateMeetingEventInput {
  eventId: string;
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmails: string[];
  format: 'in_person' | 'video';
  location: string | null;
  /** Must only be true when the occurrence doesn't already have a meet_link. Google's PATCH leaves
   * any field omitted from the body untouched — including conferenceData — so an occurrence that
   * already has a Meet link keeps it automatically as long as this stays false. Sending a *new*
   * conferenceData.createRequest on an event that already has one produces a second, different Meet
   * link and orphans the first, so this must never be true for an already-synced occurrence. */
  addConferenceData: boolean;
}

/** PATCH (not PUT) an existing event: fields omitted from the body are left as-is on Google's side,
 * which is what lets this safely update time/attendees/title without touching a Meet link the
 * caller doesn't want changed. Same conferenceDataVersion=1 requirement as createMeetingEvent when
 * addConferenceData is true. */
export async function updateMeetingEvent(input: UpdateMeetingEventInput): Promise<CreatedMeetingEvent> {
  const connection = await requireConnection();
  const token = await getAccessToken(connection);

  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startIso, timeZone: 'Asia/Makassar' },
    end: { dateTime: input.endIso, timeZone: 'Asia/Makassar' },
    attendees: input.attendeeEmails.map((email) => ({ email })),
  };
  if (input.format === 'video') {
    if (input.addConferenceData) {
      body.conferenceData = {
        createRequest: {
          requestId: `meeting-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }
  } else if (input.location) {
    body.location = input.location;
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(connection.calendar_id)}/events/${encodeURIComponent(input.eventId)}?conferenceDataVersion=1`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`Google Calendar updateEvent error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    id: string;
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };
  const meetLink = data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ?? null;
  return { eventId: data.id, meetLink };
}

/** 404/410 mean the event is already gone from Google's side (deleted manually, calendar
 * disconnected/reconnected, etc.) — treated as success rather than an error to retry, since the
 * caller's goal ("this event shouldn't exist anymore") is already satisfied. */
export async function cancelMeetingEvent(eventId: string): Promise<void> {
  const connection = await requireConnection();
  const token = await getAccessToken(connection);

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(connection.calendar_id)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Google Calendar deleteEvent error: ${res.status} ${await res.text()}`);
  }
}
