import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { SAMPLE_TERM, SAMPLE_UNITS } from '@/lib/curriculum-seed';

/** One-time import of the draft Primary 1 Mathematics sample term (see curriculum-seed.ts for
 * what it contains and why it's explicitly a draft) — admin-only, matching the timetable
 * import's gate, since this creates a whole real programme's worth of content in one click.
 * Safe to click more than once: if the programme already exists (its own unique constraint),
 * this reports that instead of erroring or duplicating anything. Sequential inserts rather than
 * a batched unnest() -- unlike schedule occurrence generation, this is ~30 rows total, nowhere
 * near enough to risk the timeout that made batching necessary there. */
export async function POST() {
  await requireAdmin();

  try {
    await ensureSchema();

    const existing = await sql`
      SELECT id FROM curriculum_terms
      WHERE class_name = ${SAMPLE_TERM.className} AND subject = ${SAMPLE_TERM.subject} AND term_label = ${SAMPLE_TERM.termLabel}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ alreadyImported: true, termId: existing[0].id });
    }

    const termRows = await sql`
      INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label)
      VALUES (${SAMPLE_TERM.className}, ${SAMPLE_TERM.subject}, ${SAMPLE_TERM.termLabel}, ${SAMPLE_TERM.frameworkLabel})
      RETURNING id
    `;
    const termId = termRows[0].id as number;

    let unitsCreated = 0;
    let lessonsCreated = 0;
    for (let unitIndex = 0; unitIndex < SAMPLE_UNITS.length; unitIndex++) {
      const unit = SAMPLE_UNITS[unitIndex];
      const unitRows = await sql`
        INSERT INTO curriculum_term_units (term_id, sort_order, title, description)
        VALUES (${termId}, ${unitIndex + 1}, ${unit.title}, ${unit.description})
        RETURNING id
      `;
      const unitId = unitRows[0].id as number;
      unitsCreated++;

      for (let lessonIndex = 0; lessonIndex < unit.lessons.length; lessonIndex++) {
        const lesson = unit.lessons[lessonIndex];
        await sql`
          INSERT INTO curriculum_unit_lessons (unit_id, sort_order, title, objectives)
          VALUES (${unitId}, ${lessonIndex + 1}, ${lesson.title}, ${lesson.objectives})
        `;
        lessonsCreated++;
      }
    }

    return NextResponse.json({ alreadyImported: false, termId, unitsCreated, lessonsCreated });
  } catch (err) {
    console.error('[api/admin/curriculum/import-sample-term] failed', err);
    return NextResponse.json({ error: 'Could not import the sample term.' }, { status: 500 });
  }
}
