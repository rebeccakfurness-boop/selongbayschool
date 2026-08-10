import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { SAMPLE_TERMS } from '@/lib/curriculum-seed';

function termKey(t: { className: string; subject: string; termLabel: string }): string {
  return `${t.className}|${t.subject}|${t.termLabel}`;
}

/** Imports every draft sample term in curriculum-seed.ts (Mathematics/English/Science across
 * Primary 1–6 — see that file for what it contains and why it's explicitly a draft) — admin-only,
 * matching the timetable import's gate. Safe to click more than once: any programme that already
 * exists is skipped individually rather than erroring or duplicating, so a partial import (or a
 * re-run after more subjects are added to the seed) only ever creates what's missing.
 *
 * At this volume (18 programmes x ~7 units x ~3 lessons, ~420 rows total) sequential one-row-at-
 * a-time inserts are exactly the mistake that made the Weekly Schedule's occurrence generation
 * time out — see academic-calendar.ts's regenerateScheduleOccurrences. Batched here the same way:
 * new terms are the only genuinely sequential part (there are at most 18, and each needs its own
 * id back), units and lessons are inserted in two batched round trips via unnest(), correlating
 * each lesson back to its unit by re-fetching the just-inserted units keyed by (term_id,
 * sort_order) rather than trusting unnest()/RETURNING to preserve row order across a batch. */
export async function POST() {
  await requireAdmin();

  try {
    await ensureSchema();

    const classNames = [...new Set(SAMPLE_TERMS.map((t) => t.className))];
    const subjects = [...new Set(SAMPLE_TERMS.map((t) => t.subject))];
    const termLabels = [...new Set(SAMPLE_TERMS.map((t) => t.termLabel))];
    const existingRows = (await sql`
      SELECT class_name, subject, term_label FROM curriculum_terms
      WHERE class_name = ANY(${classNames}) AND subject = ANY(${subjects}) AND term_label = ANY(${termLabels})
    `) as unknown as { class_name: string; subject: string; term_label: string }[];
    const existingKeys = new Set(
      existingRows.map((r) => `${r.class_name}|${r.subject}|${r.term_label}`)
    );

    const newTerms = SAMPLE_TERMS.filter((t) => !existingKeys.has(termKey(t)));
    if (newTerms.length === 0) {
      return NextResponse.json({ imported: 0, skipped: SAMPLE_TERMS.length, unitsCreated: 0, lessonsCreated: 0 });
    }

    const termIdByKey = new Map<string, number>();
    for (const t of newTerms) {
      const rows = await sql`
        INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label)
        VALUES (${t.className}, ${t.subject}, ${t.termLabel}, ${t.frameworkLabel})
        RETURNING id
      `;
      termIdByKey.set(termKey(t), rows[0].id as number);
    }

    const unitTermIds: number[] = [];
    const unitSortOrders: number[] = [];
    const unitTitles: string[] = [];
    const unitDescriptions: string[] = [];
    for (const t of newTerms) {
      const termId = termIdByKey.get(termKey(t))!;
      t.units.forEach((u, i) => {
        unitTermIds.push(termId);
        unitSortOrders.push(i + 1);
        unitTitles.push(u.title);
        unitDescriptions.push(u.description);
      });
    }
    await sql`
      INSERT INTO curriculum_term_units (term_id, sort_order, title, description)
      SELECT * FROM unnest(${unitTermIds}::bigint[], ${unitSortOrders}::int[], ${unitTitles}::text[], ${unitDescriptions}::text[])
    `;

    const newTermIds = [...termIdByKey.values()];
    const insertedUnits = (await sql`
      SELECT id, term_id, sort_order FROM curriculum_term_units WHERE term_id = ANY(${newTermIds})
    `) as unknown as { id: number; term_id: number; sort_order: number }[];
    const unitIdByTermAndOrder = new Map<string, number>();
    for (const row of insertedUnits) unitIdByTermAndOrder.set(`${row.term_id}|${row.sort_order}`, row.id);

    const lessonUnitIds: number[] = [];
    const lessonSortOrders: number[] = [];
    const lessonTitles: string[] = [];
    const lessonObjectives: string[] = [];
    for (const t of newTerms) {
      const termId = termIdByKey.get(termKey(t))!;
      t.units.forEach((u, unitIndex) => {
        const unitId = unitIdByTermAndOrder.get(`${termId}|${unitIndex + 1}`)!;
        u.lessons.forEach((lesson, lessonIndex) => {
          lessonUnitIds.push(unitId);
          lessonSortOrders.push(lessonIndex + 1);
          lessonTitles.push(lesson.title);
          lessonObjectives.push(lesson.objectives);
        });
      });
    }
    await sql`
      INSERT INTO curriculum_unit_lessons (unit_id, sort_order, title, objectives)
      SELECT * FROM unnest(${lessonUnitIds}::bigint[], ${lessonSortOrders}::int[], ${lessonTitles}::text[], ${lessonObjectives}::text[])
    `;

    return NextResponse.json({
      imported: newTerms.length,
      skipped: SAMPLE_TERMS.length - newTerms.length,
      unitsCreated: unitTermIds.length,
      lessonsCreated: lessonUnitIds.length,
    });
  } catch (err) {
    console.error('[api/admin/curriculum/import-sample-term] failed', err);
    return NextResponse.json({ error: 'Could not import the sample terms.' }, { status: 500 });
  }
}
