import { ensureSchema, sql } from '../src/lib/db';
import { activities } from '../src/lib/site-content';

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

async function seedRecurringActivity(slug: string, name: string, day: string, time: string, capacity: number, occurrences: number) {
  const weekday = WEEKDAY_INDEX[day];
  if (weekday === undefined) return;
  const dates = nextOccurrences(weekday, occurrences);
  for (const date of dates) {
    const dateStr = toDateString(date);
    const existing = await sql`
      SELECT id FROM booking_slots WHERE activity_slug = ${slug} AND slot_date = ${dateStr} AND slot_time = ${time}
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO booking_slots (activity_slug, activity_name, slot_date, slot_time, capacity, spots_remaining)
      VALUES (${slug}, ${name}, ${dateStr}, ${time}, ${capacity}, ${capacity})
    `;
  }
  console.log(`Seeded ${dates.length} slot(s) for ${name}`);
}

async function seedWeekdayRun(slug: string, name: string, time: string, capacity: number, weeks: number) {
  const weekdays = [1, 2, 3, 4, 5];
  let count = 0;
  for (let w = 0; w < weeks; w++) {
    for (const weekday of weekdays) {
      const dates = nextOccurrences(weekday, 1, new Date(Date.now() + w * 7 * 24 * 60 * 60 * 1000));
      const dateStr = toDateString(dates[0]);
      const existing = await sql`
        SELECT id FROM booking_slots WHERE activity_slug = ${slug} AND slot_date = ${dateStr} AND slot_time = ${time}
      `;
      if (existing.length > 0) continue;
      await sql`
        INSERT INTO booking_slots (activity_slug, activity_name, slot_date, slot_time, capacity, spots_remaining)
        VALUES (${slug}, ${name}, ${dateStr}, ${time}, ${capacity}, ${capacity})
      `;
      count++;
    }
  }
  console.log(`Seeded ${count} slot(s) for ${name}`);
}

async function main() {
  await ensureSchema();

  await seedRecurringActivity('hip-hop-dance-ninja-warrior', 'Hip Hop Dance and Ninja Warrior', 'Monday', '14:00', 12, 6);
  await seedRecurringActivity('gymnastics-free-swim', 'Gymnastics for Kids & Free Swim', 'Tuesday', '14:00', 12, 6);
  await seedRecurringActivity('surfing-selong-belanak', 'Surfing Selong Belanak Beach', 'Wednesday', '14:00', 8, 6);
  await seedRecurringActivity('art-music-bahasa', 'Art, Music and Bahasa Indonesia', 'Thursday', '14:00', 12, 6);
  await seedRecurringActivity('scouts-survival-challenge', 'Scouts and Survival Challenge', 'Friday', '14:00', 12, 6);
  await seedRecurringActivity('school-tour', 'School Tour', 'Friday', '10:00', 15, 6);
  await seedWeekdayRun('adventure-camp-2026-per-day', 'Adventure Camp 2026 (Per Day)', '08:00', 12, 4);
  await seedRecurringActivity('adventure-camp-2026-full-week', 'Adventure Camp 2026 (Full Week)', 'Monday', '08:00', 12, 4);

  const names = new Set(activities.map((a) => a.slug));
  console.log('Seed complete for activities:', [...names].join(', '));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
