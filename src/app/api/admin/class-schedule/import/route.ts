import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { SCHOOL_TIMETABLE_SEED } from '@/lib/class-schedule-seed';

/** One-time bulk import of the real school timetable (extracted from the spreadsheet the school
 * provided — see class-schedule-seed.ts for exactly what it contains and what's a best guess).
 * Safe to click more than once: skips any (class_name, subject, day_of_week, start_time) that's
 * already in the table, so a partial import or a re-run after editing the seed file never
 * duplicates rows. Admin-only, same as every other write on this page.
 *
 * Inserts everything in one round trip via unnest() rather than looping one INSERT per row (~100
 * rows) — the original one-row-at-a-time version comfortably blew past Vercel's serverless
 * function time limit on the Hobby plan (10s) before it could finish and respond, which looked
 * to the browser like the click did nothing. */
export async function POST() {
  await requireAdmin();

  try {
    await ensureSchema();

    const existing = (await sql`
      SELECT class_name, subject, day_of_week, start_time::text FROM class_schedule
    `) as unknown as { class_name: string; subject: string; day_of_week: string; start_time: string }[];
    const existingKeys = new Set(existing.map((e) => `${e.class_name}|${e.subject}|${e.day_of_week}|${e.start_time.slice(0, 5)}`));

    const toInsert: { className: string; subject: string; dayOfWeek: string; startTime: string; endTime: string }[] = [];
    let skipped = 0;
    for (const [className, entries] of Object.entries(SCHOOL_TIMETABLE_SEED)) {
      for (const entry of entries) {
        const key = `${className}|${entry.subject}|${entry.dayOfWeek}|${entry.startTime}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        existingKeys.add(key); // guards against the seed data itself listing the same slot twice
        toInsert.push({ className, subject: entry.subject, dayOfWeek: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime });
      }
    }

    if (toInsert.length > 0) {
      await sql`
        INSERT INTO class_schedule (class_name, subject, day_of_week, start_time, end_time, format)
        SELECT * FROM unnest(
          ${toInsert.map((e) => e.className)}::text[],
          ${toInsert.map((e) => e.subject)}::text[],
          ${toInsert.map((e) => e.dayOfWeek)}::text[],
          ${toInsert.map((e) => e.startTime)}::time[],
          ${toInsert.map((e) => e.endTime)}::time[],
          ${toInsert.map(() => 'in_person')}::text[]
        )
      `;
    }

    return NextResponse.json({ inserted: toInsert.length, skipped });
  } catch (err) {
    console.error('[api/admin/class-schedule/import] failed', err);
    return NextResponse.json({ error: `Could not import timetable: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
