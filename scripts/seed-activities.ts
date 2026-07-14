import { ensureSchema, sql } from '../src/lib/db';
import type { Activity } from '../src/lib/site-content';

/** Initial activities data, inserted into the `activities` table on first run (upserted by slug on later runs). */
const seedActivities: Activity[] = [
  {
    slug: 'hip-hop-dance-ninja-warrior',
    name: 'Hip Hop Dance and Ninja Warrior',
    day: 'Monday',
    duration: '2 hr',
    priceIDR: 300_000,
    description: 'High-energy dance moves paired with an obstacle-course challenge, building rhythm, confidence, and coordination.',
    ageGroup: 'All ages',
  },
  {
    slug: 'gymnastics-free-swim',
    name: 'Gymnastics for Kids & Free Swim',
    day: 'Tuesday',
    duration: null,
    priceIDR: 300_000,
    description: 'Foundational gymnastics skills followed by free swim time to cool off.',
    ageGroup: 'All ages',
  },
  {
    slug: 'surfing-selong-belanak',
    name: 'Surfing Selong Belanak Beach',
    day: 'Wednesday',
    duration: '2 hr',
    priceIDR: 300_000,
    description: 'Beginner-friendly surf lessons at Selong Belanak Beach, right on our doorstep.',
    ageGroup: 'All ages',
  },
  {
    slug: 'art-music-bahasa',
    name: 'Art, Music and Bahasa Indonesia',
    day: 'Thursday',
    duration: null,
    priceIDR: 300_000,
    description: 'A creative afternoon blending art and music with hands-on Bahasa Indonesia language learning.',
    ageGroup: 'All ages',
  },
  {
    slug: 'scouts-survival-challenge',
    name: 'Scouts and Survival Challenge',
    day: 'Friday',
    duration: '2 hr',
    priceIDR: 300_000,
    description: 'Outdoor scouting skills and a friendly survival challenge in and around the campus.',
    ageGroup: 'All ages',
  },
  {
    slug: 'school-tour',
    name: 'School Tour',
    day: 'By request',
    duration: '1 hr',
    priceIDR: null,
    priceNote: 'Free',
    description: 'A guided walk through our campus, classrooms, and grounds: a great first step for prospective families.',
    ageGroup: 'All ages',
  },
  {
    slug: 'adventure-camp-2026-per-day',
    name: 'Adventure Camp 2026 (Per Day)',
    day: 'Mon–Fri',
    duration: '6 hr',
    priceIDR: 450_000,
    description: 'A full day of adventure activities: surf, scouting, sport, and campus exploration, bookable one day at a time.',
    ageGroup: 'All ages',
  },
  {
    slug: 'adventure-camp-2026-full-week',
    name: 'Adventure Camp 2026 (Full Week)',
    day: 'Mon–Fri',
    duration: '6 hr',
    priceIDR: null,
    priceNote: 'Contact us for pricing',
    description: 'The full Adventure Camp week: surf, scouting, sport, and campus exploration every day.',
    ageGroup: 'All ages',
  },
];

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function nextOccurrences(weekday: number, count: number, startingFrom = new Date()): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(startingFrom);
  cursor.setHours(0, 0, 0, 0);
  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === weekday) {
      dates.push(new Date(cursor));
    }
  }
  return dates;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function upsertActivities(): Promise<Map<string, number>> {
  const idBySlug = new Map<string, number>();
  for (const activity of seedActivities) {
    const rows = await sql`
      INSERT INTO activities (slug, name, day, duration, price_idr, price_note, description, age_group)
      VALUES (
        ${activity.slug}, ${activity.name}, ${activity.day}, ${activity.duration},
        ${activity.priceIDR}, ${activity.priceNote ?? null}, ${activity.description}, ${activity.ageGroup}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        day = EXCLUDED.day,
        duration = EXCLUDED.duration,
        price_idr = EXCLUDED.price_idr,
        price_note = EXCLUDED.price_note,
        description = EXCLUDED.description,
        age_group = EXCLUDED.age_group
      RETURNING id, slug
    `;
    idBySlug.set(rows[0].slug as string, rows[0].id as number);
  }
  console.log(`Upserted ${idBySlug.size} activities`);
  return idBySlug;
}

async function seedRecurringActivity(activityId: number, name: string, day: string, time: string, capacity: number, occurrences: number) {
  const weekday = WEEKDAY_INDEX[day];
  if (weekday === undefined) return;
  const dates = nextOccurrences(weekday, occurrences);
  for (const date of dates) {
    const dateStr = toDateString(date);
    const existing = await sql`
      SELECT id FROM sessions WHERE activity_id = ${activityId} AND session_date = ${dateStr} AND session_time = ${time}
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO sessions (activity_id, session_date, session_time, capacity, spots_remaining)
      VALUES (${activityId}, ${dateStr}, ${time}, ${capacity}, ${capacity})
    `;
  }
  console.log(`Seeded ${dates.length} session(s) for ${name}`);
}

async function seedWeekdayRun(activityId: number, name: string, time: string, capacity: number, weeks: number) {
  const weekdays = [1, 2, 3, 4, 5];
  let count = 0;
  for (let w = 0; w < weeks; w++) {
    for (const weekday of weekdays) {
      const dates = nextOccurrences(weekday, 1, new Date(Date.now() + w * 7 * 24 * 60 * 60 * 1000));
      const dateStr = toDateString(dates[0]);
      const existing = await sql`
        SELECT id FROM sessions WHERE activity_id = ${activityId} AND session_date = ${dateStr} AND session_time = ${time}
      `;
      if (existing.length > 0) continue;
      await sql`
        INSERT INTO sessions (activity_id, session_date, session_time, capacity, spots_remaining)
        VALUES (${activityId}, ${dateStr}, ${time}, ${capacity}, ${capacity})
      `;
      count++;
    }
  }
  console.log(`Seeded ${count} session(s) for ${name}`);
}

async function main() {
  await ensureSchema();
  const idBySlug = await upsertActivities();

  const id = (slug: string): number => {
    const activityId = idBySlug.get(slug);
    if (!activityId) throw new Error(`Activity not found after upsert: ${slug}`);
    return activityId;
  };

  await seedRecurringActivity(id('hip-hop-dance-ninja-warrior'), 'Hip Hop Dance and Ninja Warrior', 'Monday', '14:00', 12, 6);
  await seedRecurringActivity(id('gymnastics-free-swim'), 'Gymnastics for Kids & Free Swim', 'Tuesday', '14:00', 12, 6);
  await seedRecurringActivity(id('surfing-selong-belanak'), 'Surfing Selong Belanak Beach', 'Wednesday', '14:00', 8, 6);
  await seedRecurringActivity(id('art-music-bahasa'), 'Art, Music and Bahasa Indonesia', 'Thursday', '14:00', 12, 6);
  await seedRecurringActivity(id('scouts-survival-challenge'), 'Scouts and Survival Challenge', 'Friday', '14:00', 12, 6);
  await seedRecurringActivity(id('school-tour'), 'School Tour', 'Friday', '10:00', 15, 6);
  await seedWeekdayRun(id('adventure-camp-2026-per-day'), 'Adventure Camp 2026 (Per Day)', '08:00', 12, 4);
  await seedRecurringActivity(id('adventure-camp-2026-full-week'), 'Adventure Camp 2026 (Full Week)', 'Monday', '08:00', 12, 4);

  console.log('Seed complete for activities:', [...idBySlug.keys()].join(', '));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
