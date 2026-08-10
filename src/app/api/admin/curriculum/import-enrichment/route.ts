import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { ENRICHMENT_LESSONS } from '@/lib/curriculum-enrichment-seed';

function lessonKey(classNameVal: string, subject: string, unitTitle: string, lessonTitle: string): string {
  return `${classNameVal}|${subject}|${unitTitle}|${lessonTitle}`;
}

/** Applies ENRICHMENT_LESSONS (quiz content for Primary 1-2 Mathematics/English) to whichever
 * lessons already exist with matching titles -- run this after "Import sample terms" has created
 * those lessons. Matches by (class, subject, unit title, lesson title) rather than id, and skips
 * (individually, not as a whole-batch failure) anything that doesn't match a real lesson, or a
 * lesson that already has quiz questions -- so it's safe to click again after content changes.
 *
 * At this volume (up to ~68 lessons x ~6 questions) sequential per-lesson writes would repeat the
 * timeout mistake from the Weekly Schedule's occurrence generation -- see the sample-term import
 * route's own comment. Batched the same way: one broad existence query per level (terms, units,
 * lessons, already-quizzed lessons), then two unnest()-based multi-row writes (equipment notes,
 * quiz questions) rather than one round trip per lesson or per question. */
export async function POST() {
  await requireAdmin();

  try {
    await ensureSchema();

    const classNames = [...new Set(ENRICHMENT_LESSONS.map((l) => l.className))];
    const subjects = [...new Set(ENRICHMENT_LESSONS.map((l) => l.subject))];
    const terms = (await sql`
      SELECT id, class_name, subject FROM curriculum_terms
      WHERE class_name = ANY(${classNames}) AND subject = ANY(${subjects})
    `) as unknown as { id: number; class_name: string; subject: string }[];
    if (terms.length === 0) {
      return NextResponse.json({
        matched: 0, skippedNoLesson: ENRICHMENT_LESSONS.length, skippedAlready: 0,
        equipmentNotesAdded: 0, questionsAdded: 0,
        note: 'No matching programmes found — import the sample terms first.',
      });
    }
    const termIdByClassSubject = new Map<string, number>();
    for (const t of terms) termIdByClassSubject.set(`${t.class_name}|${t.subject}`, t.id);
    const termIds = terms.map((t) => t.id);

    const units = (await sql`
      SELECT id, term_id, title FROM curriculum_term_units WHERE term_id = ANY(${termIds})
    `) as unknown as { id: number; term_id: number; title: string }[];
    const unitIdByTermAndTitle = new Map<string, number>();
    for (const u of units) unitIdByTermAndTitle.set(`${u.term_id}|${u.title}`, u.id);
    const unitIds = units.map((u) => u.id);

    const lessons =
      unitIds.length === 0
        ? []
        : ((await sql`
            SELECT id, unit_id, title, equipment_note FROM curriculum_unit_lessons WHERE unit_id = ANY(${unitIds})
          `) as unknown as { id: number; unit_id: number; title: string; equipment_note: string | null }[]);
    const lessonIdByUnitAndTitle = new Map<string, { id: number; equipmentNote: string | null }>();
    for (const l of lessons) lessonIdByUnitAndTitle.set(`${l.unit_id}|${l.title}`, { id: l.id, equipmentNote: l.equipment_note });
    const lessonIds = lessons.map((l) => l.id);

    const alreadyQuizzedRows =
      lessonIds.length === 0
        ? []
        : ((await sql`
            SELECT DISTINCT lesson_id FROM curriculum_lesson_quiz_questions WHERE lesson_id = ANY(${lessonIds})
          `) as unknown as { lesson_id: number }[]);
    const alreadyQuizzed = new Set(alreadyQuizzedRows.map((r) => r.lesson_id));

    let skippedNoLesson = 0;
    let skippedAlready = 0;
    const toApply: { lessonId: number; entry: (typeof ENRICHMENT_LESSONS)[number]; needsEquipmentNote: boolean }[] = [];

    for (const entry of ENRICHMENT_LESSONS) {
      const termId = termIdByClassSubject.get(`${entry.className}|${entry.subject}`);
      const unitId = termId !== undefined ? unitIdByTermAndTitle.get(`${termId}|${entry.unitTitle}`) : undefined;
      const lesson = unitId !== undefined ? lessonIdByUnitAndTitle.get(`${unitId}|${entry.lessonTitle}`) : undefined;
      if (!lesson) {
        skippedNoLesson++;
        continue;
      }
      if (alreadyQuizzed.has(lesson.id)) {
        skippedAlready++;
        continue;
      }
      toApply.push({ lessonId: lesson.id, entry, needsEquipmentNote: lesson.equipmentNote === null });
    }

    if (toApply.length === 0) {
      return NextResponse.json({ matched: 0, skippedNoLesson, skippedAlready, equipmentNotesAdded: 0, questionsAdded: 0 });
    }

    const equipmentLessonIds = toApply.filter((a) => a.needsEquipmentNote).map((a) => a.lessonId);
    const equipmentNotes = toApply.filter((a) => a.needsEquipmentNote).map((a) => a.entry.equipmentNote);
    if (equipmentLessonIds.length > 0) {
      await sql`
        UPDATE curriculum_unit_lessons AS l SET equipment_note = v.equipment_note
        FROM (SELECT * FROM unnest(${equipmentLessonIds}::bigint[], ${equipmentNotes}::text[]) AS t(lesson_id, equipment_note)) v
        WHERE l.id = v.lesson_id AND l.equipment_note IS NULL
      `;
    }

    // Not a flat unnest() batch like the other bulk imports in this app: each question's `options`
    // is itself a variable-length array (2 options here, 3 there), and Postgres arrays passed to
    // unnest() must all share one rectangular shape -- a jagged array-of-arrays can't be cast to
    // text[][] at all. Staged as one jsonb blob instead, unpacked row-by-row server-side via
    // jsonb_array_elements, with each row's own options list converted to a real text[]
    // independently via jsonb_array_elements_text -- still one round trip, just not unnest().
    const rows: {
      lesson_id: number; quiz_type: string; sort_order: number; question: string; options: string[]; correct_option_index: number; hint: string | null;
    }[] = [];
    for (const { lessonId, entry } of toApply) {
      entry.starterQuiz.forEach((q, i) => {
        rows.push({ lesson_id: lessonId, quiz_type: 'starter', sort_order: i + 1, question: q.question, options: q.options, correct_option_index: q.correctOptionIndex, hint: q.hint ?? null });
      });
      entry.exitQuiz.forEach((q, i) => {
        rows.push({ lesson_id: lessonId, quiz_type: 'exit', sort_order: i + 1, question: q.question, options: q.options, correct_option_index: q.correctOptionIndex, hint: q.hint ?? null });
      });
    }

    await sql`
      INSERT INTO curriculum_lesson_quiz_questions (lesson_id, quiz_type, sort_order, question, options, correct_option_index, hint)
      SELECT
        (x->>'lesson_id')::bigint,
        x->>'quiz_type',
        (x->>'sort_order')::int,
        x->>'question',
        ARRAY(SELECT jsonb_array_elements_text(x->'options')),
        (x->>'correct_option_index')::int,
        x->>'hint'
      FROM jsonb_array_elements(${JSON.stringify(rows)}::jsonb) AS x
    `;

    return NextResponse.json({
      matched: toApply.length,
      skippedNoLesson,
      skippedAlready,
      equipmentNotesAdded: equipmentLessonIds.length,
      questionsAdded: rows.length,
    });
  } catch (err) {
    console.error('[api/admin/curriculum/import-enrichment] failed', err);
    return NextResponse.json({ error: 'Could not import quiz content.' }, { status: 500 });
  }
}
