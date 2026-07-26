import { ensureSchema, sql } from '@/lib/db';
import { sendSessionCancellationEmail } from '@/lib/email';

/**
 * Keeps the current/future sessions for the weekday activities and School Tour in sync with a
 * fixed 10-week term (27 July - 2 October 2026): 1:30pm-3:30pm for the weekday activities, and
 * midday for School Tour, Monday-Friday. Football is Monday's activity, starting 3 August (the
 * second Monday of the term). Hip Hop Dance and Ninja Warrior is retired: deactivated (kept in
 * the database for historical bookings, just hidden from the public site) and every one of its
 * current/future sessions is removed the same way as any other stale session below. Every
 * activity in WEEKDAY_ACTIVITIES/School Tour is (re)activated on each run, so bringing one back
 * (like Gymnastics for Kids & Free Swim) just means moving it back into that list.
 *
 * Any existing session for an active target activity that isn't part of the schedule above is
 * removed: deleted outright if nobody has booked it, or cancelled (with the same cancellation
 * email the admin "Cancel session" button sends) if it has real bookings. A session that already
 * exists but with a different capacity has its capacity brought in line instead. Past sessions
 * are left untouched, and no other activity (e.g. Adventure Camp) is touched.
 */

const TERM_START = new Date('2026-07-27T00:00:00'); // Monday
const TERM_WEEKS = 10;
const TERM_END_EXCLUSIVE = new Date(TERM_START);
TERM_END_EXCLUSIVE.setDate(TERM_END_EXCLUSIVE.getDate() + TERM_WEEKS * 7);

// The second Monday of the term: where Football's run begins.
const SECOND_MONDAY = new Date(TERM_START);
SECOND_MONDAY.setDate(SECOND_MONDAY.getDate() + 7);

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
  start: Date;
  endExclusive: Date;
  /** Only needed for an activity that may not exist in the activities table yet. */
  seed?: { name: string; description: string; priceIDR: number; duration: string; ageGroup: string };
}

const WEEKDAY_ACTIVITIES: WeekdayActivity[] = [
  {
    slug: 'football',
    day: 'Monday',
    time: '13:30',
    capacity: 12,
    start: SECOND_MONDAY,
    endExclusive: TERM_END_EXCLUSIVE,
    seed: {
      name: 'Football',
      description: 'Football skills, drills, and friendly matches that build teamwork, fitness, and confidence on the pitch.',
      priceIDR: 300_000,
      duration: '2 hr',
      ageGroup: 'All ages',
    },
  },
  { slug: 'gymnastics-free-swim', day: 'Tuesday', time: '13:30', capacity: 12, start: TERM_START, endExclusive: TERM_END_EXCLUSIVE },
  { slug: 'surfing-selong-belanak', day: 'Wednesday', time: '13:30', capacity: 8, start: TERM_START, endExclusive: TERM_END_EXCLUSIVE },
  { slug: 'art-music-bahasa', day: 'Thursday', time: '13:30', capacity: 12, start: TERM_START, endExclusive: TERM_END_EXCLUSIVE },
  { slug: 'scouts-survival-challenge', day: 'Friday', time: '13:30', capacity: 12, start: TERM_START, endExclusive: TERM_END_EXCLUSIVE },
];

// No longer offered. Every one of its current/future sessions is treated as stale and removed
// below (its id is still included in the stale-session scan), and the activity is deactivated so
// it drops off the public site, but its row (and any past bookings) stay in the database.
const DEACTIVATED_ACTIVITY_SLUGS = ['hip-hop-dance-ninja-warrior'];

const SCHOOL_TOUR_SLUG = 'school-tour';
const SCHOOL_TOUR_TIMES = ['12:00'];
const SCHOOL_TOUR_CAPACITY = 8;

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Every occurrence of `weekday` from `start` (inclusive) up to `endExclusive`. */
function datesForWeekdayInRange(weekday: number, start: Date, endExclusive: Date): string[] {
  const cursor = new Date(start);
  while (cursor.getDay() !== weekday) {
    cursor.setDate(cursor.getDate() + 1);
  }
  const dates: string[] = [];
  while (cursor < endExclusive) {
    dates.push(toDateString(cursor));
    cursor.setDate(cursor.getDate() + 7);
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

/** Looks up an activity by slug, creating it first (from `activity.seed`) if it doesn't exist yet. */
async function ensureActivityId(activity: WeekdayActivity): Promise<number> {
  const rows = await sql`SELECT id FROM activities WHERE slug = ${activity.slug}`;
  if (rows.length > 0) return rows[0].id as number;
  if (!activity.seed) {
    throw new Error(`Activity not found: ${activity.slug}. Run "npm run db:seed" first.`);
  }
  const inserted = await sql`
    INSERT INTO activities (slug, name, day, duration, price_idr, description, age_group)
    VALUES (${activity.slug}, ${activity.seed.name}, ${activity.day}, ${activity.seed.duration}, ${activity.seed.priceIDR}, ${activity.seed.description}, ${activity.seed.ageGroup})
    RETURNING id
  `;
  return inserted[0].id as number;
}

async function buildTargetSessions(): Promise<{ targets: TargetSession[]; activityIds: number[]; liveActivityIds: number[] }> {
  const targets: TargetSession[] = [];
  const activityIds: number[] = [];
  const liveActivityIds: number[] = [];

  for (const activity of WEEKDAY_ACTIVITIES) {
    const id = await ensureActivityId(activity);
    activityIds.push(id);
    liveActivityIds.push(id);
    for (const date of datesForWeekdayInRange(WEEKDAY_INDEX[activity.day], activity.start, activity.endExclusive)) {
      targets.push({ activityId: id, date, time: activity.time, capacity: activity.capacity });
    }
  }

  const schoolTourId = await activityIdBySlug(SCHOOL_TOUR_SLUG);
  activityIds.push(schoolTourId);
  liveActivityIds.push(schoolTourId);
  for (const weekday of [1, 2, 3, 4, 5]) {
    for (const date of datesForWeekdayInRange(weekday, TERM_START, TERM_END_EXCLUSIVE)) {
      for (const time of SCHOOL_TOUR_TIMES) {
        targets.push({ activityId: schoolTourId, date, time, capacity: SCHOOL_TOUR_CAPACITY });
      }
    }
  }

  for (const slug of DEACTIVATED_ACTIVITY_SLUGS) {
    activityIds.push(await activityIdBySlug(slug));
  }

  return { targets, activityIds, liveActivityIds };
}

/**
 * Creates any target session that doesn't exist yet. For one that already exists (e.g. from an
 * earlier run of this same reschedule with a different capacity), brings its capacity in line
 * with the target instead of leaving it stale — but never below however many people are already
 * booked into it, so an existing session never ends up with a negative spots_remaining.
 */
async function syncTargetSessions(targets: TargetSession[]): Promise<{ created: number; capacityUpdated: number }> {
  let created = 0;
  let capacityUpdated = 0;
  for (const target of targets) {
    const existing = await sql`
      SELECT id, capacity FROM sessions WHERE activity_id = ${target.activityId} AND session_date = ${target.date} AND session_time = ${target.time}
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO sessions (activity_id, session_date, session_time, capacity, spots_remaining)
        VALUES (${target.activityId}, ${target.date}, ${target.time}, ${target.capacity}, ${target.capacity})
      `;
      created++;
      continue;
    }

    const session = existing[0];
    if (session.capacity === target.capacity) continue;

    const bookingCountRows = await sql`SELECT count(*)::int AS n FROM bookings WHERE slot_id = ${session.id} AND status != 'cancelled'`;
    const bookingCount = bookingCountRows[0].n as number;
    const newCapacity = Math.max(target.capacity, bookingCount);
    await sql`UPDATE sessions SET capacity = ${newCapacity}, spots_remaining = ${newCapacity - bookingCount} WHERE id = ${session.id}`;
    capacityUpdated++;
  }
  return { created, capacityUpdated };
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

async function deactivateActivities(slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    await sql`UPDATE activities SET is_active = false WHERE slug = ${slug}`;
  }
}

/** Reverses a previous deactivation for anything back in WEEKDAY_ACTIVITIES/School Tour, so bringing an activity back just means moving it back into that list and re-running this. */
async function activateActivities(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await sql`UPDATE activities SET is_active = true WHERE id = ANY(${ids}) AND is_active = false`;
}

export interface RescheduleResult {
  termStart: string;
  termWeeks: number;
  created: number;
  capacityUpdated: number;
  deleted: number;
  cancelled: number;
  emailed: number;
  deactivated: number;
}

export async function runRescheduleActivities(): Promise<RescheduleResult> {
  await ensureSchema();

  const { targets, activityIds, liveActivityIds } = await buildTargetSessions();
  const keep = new Set(targets.map((t) => `${t.activityId}|${t.date}|${t.time}`));

  const { created, capacityUpdated } = await syncTargetSessions(targets);
  await activateActivities(liveActivityIds);
  await deactivateActivities(DEACTIVATED_ACTIVITY_SLUGS);

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
    capacityUpdated,
    deleted,
    cancelled,
    emailed,
    deactivated: DEACTIVATED_ACTIVITY_SLUGS.length,
  };
}
