import { sql } from './db';
import {
  createMeetingEvent,
  updateMeetingEvent,
  cancelMeetingEvent,
  getWorkspaceDomain,
} from './google-calendar';

interface OccurrenceRow {
  id: number;
  occurrence_date: string;
  starts_at: string;
  ends_at: string;
  is_cancelled: boolean;
  meet_link: string | null;
  google_calendar_event_id: string | null;
  class_schedule_id: number;
  class_name: string;
  subject: string;
  format: 'online' | 'in_person';
  location_or_link: string | null;
  teacher_id: number | null;
  teacher_email: string | null;
  teacher_label: string | null;
}

interface OverrideRow {
  schedule_type: string;
  applies: boolean;
  format_override: 'online' | 'in_person' | null;
}

/** A session's base format can be overridden per schedule_type (e.g. a Hybrid student joins online
 * what an On-Site student attends in person — see class_schedule_type_overrides). The calendar
 * event is one event per occurrence, not one per student, so it needs a single video/in-person
 * decision: video if the base format is online, or if any schedule type that still applies to this
 * session has been overridden to online — that's what actually determines whether anyone needs a
 * Meet link to join. */
function occurrenceNeedsVideo(format: string, overrides: OverrideRow[]): boolean {
  if (format === 'online') return true;
  return overrides.some((o) => o.applies && o.format_override === 'online');
}

/** Only guardians whose account email is on the school's own Workspace domain can be added as real
 * Calendar attendees (per the confirmed scope: families are on personal Gmail/other, not
 * Workspace) — everyone else still sees the session and Meet link inside the dashboard itself, via
 * the occurrence row's own meet_link column, just not as a native Calendar invite. */
async function resolveAttendeeEmails(className: string, teacherEmail: string | null): Promise<string[]> {
  const domain = await getWorkspaceDomain();
  const emails = new Set<string>();
  if (teacherEmail) emails.add(teacherEmail.toLowerCase());

  if (domain) {
    const guardians = (await sql`
      SELECT DISTINCT cust.email
      FROM guardian_children gc
      JOIN customers cust ON cust.id = gc.customer_id
      JOIN children c ON c.id = gc.child_id
      WHERE gc.status = 'approved' AND c.class_name = ${className} AND c.is_active = true
    `) as unknown as { email: string }[];
    for (const g of guardians) {
      if (g.email.toLowerCase().endsWith(`@${domain}`)) {
        emails.add(g.email.toLowerCase());
      }
    }
  }

  return Array.from(emails);
}

async function loadOccurrence(occurrenceId: number): Promise<OccurrenceRow | null> {
  const rows = (await sql`
    SELECT
      o.id, o.occurrence_date::text, o.starts_at::text, o.ends_at::text, o.is_cancelled,
      o.meet_link, o.google_calendar_event_id,
      cs.id AS class_schedule_id, cs.class_name, cs.subject, cs.format, cs.location_or_link,
      cs.teacher_id, au.email AS teacher_email, COALESCE(au.display_name, au.email) AS teacher_label
    FROM schedule_session_occurrences o
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    LEFT JOIN admin_users au ON au.id = cs.teacher_id
    WHERE o.id = ${occurrenceId}
  `) as unknown as OccurrenceRow[];
  return rows[0] || null;
}

async function markSynced(occurrenceId: number, fields: { meetLink: string | null; eventId: string | null }): Promise<void> {
  await sql`
    UPDATE schedule_session_occurrences
    SET meet_link = ${fields.meetLink}, google_calendar_event_id = ${fields.eventId},
      calendar_sync_status = 'synced', calendar_sync_error = NULL
    WHERE id = ${occurrenceId}
  `;
}

async function markFailed(occurrenceId: number, error: string): Promise<void> {
  await sql`
    UPDATE schedule_session_occurrences
    SET calendar_sync_status = 'failed', calendar_sync_error = ${error}
    WHERE id = ${occurrenceId}
  `;
}

/** Creates, updates, or cancels the Google Calendar event for a single occurrence, then writes the
 * result back to schedule_session_occurrences — never throws, so a batch cron loop (see
 * /api/cron/sync-session-meetings) can process many occurrences without one bad row aborting the
 * rest; failures are recorded on the row itself (calendar_sync_status = 'failed') for the admin to
 * see instead. Intentionally does one Google API call per occurrence rather than a bulk call — this
 * must only ever be invoked from the cron's bounded batch loop or a single-row admin action, never
 * inline inside a bulk operation like regenerateScheduleOccurrences (see that function's own
 * comments for why: sequential external HTTP calls inside a bulk DB operation reproduces the exact
 * timeout bug that unnest()-based batching was introduced to fix). */
export async function createOrUpdateMeetingForOccurrence(occurrenceId: number): Promise<{ ok: boolean }> {
  const occurrence = await loadOccurrence(occurrenceId);
  if (!occurrence) return { ok: false };

  try {
    // Cancelled or unassigned sessions shouldn't have a live calendar event — clean up any
    // existing one and stop there, rather than trying to create/update one that shouldn't exist.
    if (occurrence.is_cancelled || !occurrence.teacher_id) {
      if (occurrence.google_calendar_event_id) {
        await cancelMeetingEvent(occurrence.google_calendar_event_id);
      }
      await markSynced(occurrenceId, { meetLink: null, eventId: null });
      return { ok: true };
    }

    const overrides = (await sql`
      SELECT schedule_type, applies, format_override
      FROM class_schedule_type_overrides WHERE class_schedule_id = ${occurrence.class_schedule_id}
    `) as unknown as OverrideRow[];
    const needsVideo = occurrenceNeedsVideo(occurrence.format, overrides);
    const attendeeEmails = await resolveAttendeeEmails(occurrence.class_name, occurrence.teacher_email);

    const summary = `${occurrence.subject} — ${occurrence.class_name}`;
    const description = `${occurrence.subject} for ${occurrence.class_name}, taught by ${occurrence.teacher_label || 'TBC'}.`;
    const eventFormat: 'in_person' | 'video' = needsVideo ? 'video' : 'in_person';

    if (occurrence.google_calendar_event_id) {
      const result = await updateMeetingEvent({
        eventId: occurrence.google_calendar_event_id,
        summary,
        description,
        startIso: occurrence.starts_at,
        endIso: occurrence.ends_at,
        attendeeEmails,
        format: eventFormat,
        location: occurrence.location_or_link,
        addConferenceData: needsVideo && !occurrence.meet_link,
      });
      await markSynced(occurrenceId, {
        meetLink: needsVideo ? (result.meetLink ?? occurrence.meet_link) : null,
        eventId: result.eventId,
      });
    } else {
      const result = await createMeetingEvent({
        summary,
        description,
        startIso: occurrence.starts_at,
        endIso: occurrence.ends_at,
        attendeeEmails,
        format: eventFormat,
        location: occurrence.location_or_link,
      });
      await markSynced(occurrenceId, { meetLink: result.meetLink, eventId: result.eventId });
    }
    return { ok: true };
  } catch (err) {
    console.error(`[session-meetings] failed to sync occurrence ${occurrenceId}`, err);
    await markFailed(occurrenceId, err instanceof Error ? err.message : 'Unknown error');
    return { ok: false };
  }
}
