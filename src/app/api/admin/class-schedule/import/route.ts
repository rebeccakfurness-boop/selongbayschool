import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { SCHOOL_TIMETABLE_SEED } from '@/lib/class-schedule-seed';

/** One-time bulk import of the real school timetable (extracted from the spreadsheet the school
 * provided — see class-schedule-seed.ts for exactly what it contains and what's a best guess).
 * Safe to click more than once: skips any (class_name, subject, day_of_week, start_time) that's
 * already in the table, so a partial import or a re-run after editing the seed file never
 * duplicates rows. Admin-only, same as every other write on this page. */
export async function POST() {
  await requireAdmin();

  try {
    await ensureSchema();

    const existing = (await sql`
      SELECT class_name, subject, day_of_week, start_time::text FROM class_schedule
    `) as unknown as { class_name: string; subject: string; day_of_week: string; start_time: string }[];
    const existingKeys = new Set(existing.map((e) => `${e.class_name}|${e.subject}|${e.day_of_week}|${e.start_time.slice(0, 5)}`));

    let inserted = 0;
    let skipped = 0;
    for (const [className, entries] of Object.entries(SCHOOL_TIMETABLE_SEED)) {
      for (const entry of entries) {
        const key = `${className}|${entry.subject}|${entry.dayOfWeek}|${entry.startTime}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        await sql`
          INSERT INTO class_schedule (class_name, subject, day_of_week, start_time, end_time, format)
          VALUES (${className}, ${entry.subject}, ${entry.dayOfWeek}, ${entry.startTime}::time, ${entry.endTime}::time, 'in_person')
        `;
        existingKeys.add(key);
        inserted++;
      }
    }

    return NextResponse.json({ inserted, skipped });
  } catch (err) {
    console.error('[api/admin/class-schedule/import] failed', err);
    return NextResponse.json({ error: 'Could not import timetable.' }, { status: 500 });
  }
}
