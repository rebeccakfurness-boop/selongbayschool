import { ensureSchema, sql } from '@/lib/db';
import { sendSessionCancellationEmail } from '@/lib/email';

/**
 * Replaces every current/future session for the five weekday activities and School Tour with
 * a fixed 10-week term (1:30pm-3:30pm for the weekday activities, hourly 9am-1pm Mon-Fri for
 * School Tour). Any existing session for these activities dated today or later that isn't part
 * of the new schedule is removed: deleted outright if nobody has booked it, or cancelled (with
 * the same cancellation email the admin "Cancel session" button sends) if it has real bookings.
 * Past sessions are left untouched, and no other activity (e.g. Adventure Camp) is touched.
 */

const TERM_START = new Date('2026-07-27T00:00:00');
const TERM_WEEKS = 10;

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

interface WeekdayActivity {
  slug: string;
  day: keyof typeof WEEKDAY_INDEX;
  time: string;
  capacity: number;
}

const WEEKDAY_ACTIVITIES: WeekdayActivity[] = [
  { slug: 'hip-hop-dance-ninja-warrior', day: 'Monday', time: '13:30', capacity: 12 },
  { slug: 'gymnastics-free-swim', day: 'Tuesday', time: '13:30', capacity: 12 },
  { slug: 'surfing-selong-belanak', day: 'Wednesday', time: '13:30', capacity: 8 },
  { slug: 'art-music-bahasa', day: 'Thursday', time: '13:30', capacity: 12 },
  { slug: 'scouts-survival-challenge', day: 'Friday', time: '13:30', capacity: 12 },
];

const SCHOOL_TOUR_SLUG = 'school-tour';
const SCHOOL_TOUR_TIMES = ['09:00', '10:00', '11:00', '12:00'];
const SCHOOL_TOUR_CAPACITY = 15;

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The first occurrence of `weekday` on or after `start`, then every 7 days after that, `weeks` times total. */
function weeklyDates(start: Date, weekday: number, weeks: number): string[] {
  const first = new Date(start);
  while (first.getDay() !== weekday) {
    first.setDate(first.getDate() + 1);
  }
  const dates: string[] = [];
  for (let w = 0; w < weeks; w++) {
    const d = new Date(first);
    d.setDate(d.getDate() + w * 7);
    dates.push(toDateString(d));
  }
  return dates;
}

interface TargetSession {
  activityId: number;
  date: string;
  time: string;
  capacity: number;
}

async function activityIdBySlug(slug: string): Promise<number> {
  const rows = await sql`SELECT id FROM activities WHERE slug = ${slug}`;
  if (rows.length === 0) {
    throw new Error(`Activity not found: ${slug}. Run "npm run db:seed" first.`);
  }
  return rows[0].id as number;
}

async function buildTargetSessions(): Promise<{ targets: TargetSession[]; activityIds: number[] }> {
  const targets: TargetSession[] = [];
  const activityIds: number[] = [];

  for (const activity of WEEKDAY_ACTIVITIES) {
    const id = await activityIdBySlug(activity.slug);
    activityIds.push(id);
    for (const date of weeklyDates(TERM_START, WEEKDAY_INDEX[activity.day], TERM_WEEKS)) {
      targets.push({ activityId: id, date, time: activity.time, capacity: activity.capacity });
    }
  }

  const schoolTourId = await activityIdBySlug(SCHOOL_TOUR_SLUG);
  activityIds.push(schoolTourId);
  for (const weekday of [1, 2, 3, 4, 5]) {
    for (const date of weeklyDates(TERM_START, weekday, TERM_WEEKS)) {
      for (const time of SCHOOL_TOUR_TIMES) {
        targets.push({ activityId: schoolTourId, date, time, capacity: SCHOOL_TOUR_CAPACITY });
      }
    }
  }

  return { targets, activityIds };
}

async function createTargetSessions(targets: TargetSession[]): Promise<number> {
  let created = 0;
  for (const target of targets) {
    const existing = await sql`
      SELECT id FROM sessions WHERE activity_id = ${target.activityId} AND session_date = ${target.date} AND session_time = ${target.time}
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO sessions (activity_id, session_date, session_time, capacity, spots_remaining)
      VALUES (${target.activityId}, ${target.date}, ${target.time}, ${target.capacity}, ${target.capacity})
    `;
    created++;
  }
  return created;
}

interface StaleSessionRow {
  id: number;
  session_date: string;
  session_time: string;
  activity_name: string;
}

interface CancelledBookingRow {
  parent_name: string;
  parent_email: string;
  child_name: string;
  payment_method: string | null;
}

/** Deletes a session outright if nobody ever booked it; otherwise cancels it and the bookings on it, emailing anyone whose booking was still active. */
async function removeStaleSessions(ids: number[]): Promise<{ deleted: number; cancelled: number; emailed: number }> {
  if (ids.length === 0) return { deleted: 0, cancelled: 0, emailed: 0 };

  const rows = (await sql`
    SELECT s.id, s.session_date::text AS session_date, s.session_time, a.name AS activity_name
    FROM sessions s
    JOIN activities a ON a.id = s.activity_id
    WHERE s.id = ANY(${ids})
  `) as unknown as StaleSessionRow[];

  let deleted = 0;
  let cancelled = 0;
  let emailed = 0;

  for (const row of rows) {
    const bookingCountRows = await sql`SELECT count(*)::int AS n FROM bookings WHERE slot_id = ${row.id}`;
    const bookingCount = bookingCountRows[0].n as number;

    if (bookingCount === 0) {
      await sql`DELETE FROM sessions WHERE id = ${row.id}`;
      deleted++;
      continue;
    }

    const cancelledBookings = (await sql`
      UPDATE bookings SET status = 'cancelled'
      WHERE slot_id = ${row.id} AND status != 'cancelled'
      RETURNING parent_name, parent_email, child_name, payment_method
    `) as unknown as CancelledBookingRow[];
    await sql`UPDATE sessions SET status = 'cancelled' WHERE id = ${row.id}`;
    cancelled++;

    const dateLabel = new Date(`${row.session_date}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    for (const booking of cancelledBookings) {
      const sent = await sendSessionCancellationEmail({
        activityName: row.activity_name,
        date: dateLabel,
        time: row.session_time,
        parentName: booking.parent_name,
        parentEmail: booking.parent_email,
        childName: booking.child_name,
        mayHavePaid: booking.payment_method === 'pay_online',
      });
      if (sent) emailed++;
    }
  }

  return { deleted, cancelled, emailed };
}

export interface RescheduleResult {
  termStart: string;
  termWeeks: number;
  created: number;
  deleted: number;
  cancelled: number;
  emailed: number;
}

export async function runRescheduleActivities(): Promise<RescheduleResult> {
  await ensureSchema();

  const { targets, activityIds } = await buildTargetSessions();
  const keep = new Set(targets.map((t) => `${t.activityId}|${t.date}|${t.time}`));

  const created = await createTargetSessions(targets);

  const today = toDateString(new Date());
  const candidates = (await sql`
    SELECT s.id, s.activity_id, s.session_date::text AS session_date, s.session_time
    FROM sessions s
    WHERE s.activity_id = ANY(${activityIds}) AND s.session_date >= ${today} AND s.status = 'active'
  `) as unknown as Array<{ id: number; activity_id: number; session_date: string; session_time: string }>;

  const staleIds = candidates
    .filter((row) => !keep.has(`${row.activity_id}|${row.session_date}|${row.session_time}`))
    .map((row) => row.id);

  const { deleted, cancelled, emailed } = await removeStaleSessions(staleIds);

  return {
    termStart: toDateString(TERM_START),
    termWeeks: TERM_WEEKS,
    created,
    deleted,
    cancelled,
    emailed,
  };
}
