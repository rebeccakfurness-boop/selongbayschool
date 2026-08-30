import { sql } from '@/lib/db';
import { upsertSyllabusTopic } from '@/lib/curriculum';
import type { RealTeachingExportInput } from '@/lib/validation';
import type { LessonPhase } from '../types';

type RealLesson = RealTeachingExportInput['lessons'][number];

/** Same five-phase mapping as class-curriculum/import.ts (see that file's own comment for why
 * "practice" reads closest to "revision" and "assessment" to "exam_skill") -- kept identical
 * rather than shared, since the two importers consume different input shapes and this is the only
 * piece they'd otherwise share. */
const PHASE_MAP: Record<RealLesson['phase'], LessonPhase> = {
  content: 'content',
  practice: 'revision',
  review: 'review',
  assessment: 'exam_skill',
  project: 'content',
};

function objectivesTextFor(lesson: RealLesson): string {
  if (lesson.plan.objectives.length > 0) {
    return lesson.plan.objectives.map((o) => `${o.ref}: ${o.title}`).join('; ');
  }
  if (lesson.refs.length > 0) return lesson.refs.join(', ');
  return `Working towards the aims of ${lesson.unit}.`;
}

export interface RealImportTermResult {
  termLabel: string;
  termId: number;
  unitsCreated: number;
  lessonsCreated: number;
}

export interface RealImportResult {
  className: string;
  subject: string;
  terms: RealImportTermResult[];
}

/** Imports one already-fully-authored class export (export/<group>/<class>.json -- see
 * SCHEMA.md alongside the source, and the exact shape validated by realTeachingExportSchema) as
 * real curriculum_terms/curriculum_term_units/curriculum_unit_lessons rows -- unlike
 * class-curriculum/import.ts, nothing here schedules against the calendar or synthesizes a plan/
 * worksheet: every lesson already carries its own real date, plan and worksheet, so this is a
 * direct field mapping, one curriculum_terms row per real term the export's lessons actually use
 * (its dashboards are whole-subject-year; this app's programmes are per-term, so up to three rows
 * -- Term 1/2/3 -- come out of one class export, each one a fully independent programme in this
 * app's existing per-term Lesson Planning UI).
 *
 * Idempotent full re-sync, not an additive merge: for each (className, subject, termLabel) this
 * produces, any existing units/lessons under that term are deleted before the fresh ones are
 * inserted (the term row itself is upserted, keeping its id and anything else pointing at it,
 * e.g. occurrence assignments a teacher already made would be lost on re-import same as any
 * lesson replacement). This is deliberate: re-running against updated source data, or replacing
 * an earlier hand-authored placeholder programme for the same class/subject/term, should always
 * leave exactly the export's current content behind, never a duplicate on top of the old.
 *
 * source_verified is deliberately left null (unspecified) rather than guessed at true/false --
 * curriculum.note already states, per class, exactly how far the objective codes can be trusted
 * (sometimes real Cambridge refs, sometimes a strand-level reconstruction), and collapsing that
 * into one boolean would soften exactly the nuance requirement #1 in the source's own
 * INTEGRATION.md says must never be softened. source_note carries the note text verbatim instead.
 *
 * Every lesson lands as review_status = 'needs_review', same as every other import path in this
 * app -- nothing here is visible to a parent or student until a teacher publishes it. */
export async function importRealTeachingExport(data: RealTeachingExportInput, className: string): Promise<RealImportResult> {
  const subject = data.short;
  const frameworkLabel = `${data.curriculum.title}${data.curriculum.code ? ` (${data.curriculum.code})` : ''}, ${data.curriculum.stage}`;
  const ongoingCardJson = data.ongoing ? JSON.stringify(data.ongoing) : null;

  const byTerm = new Map<string, RealLesson[]>();
  for (const lesson of data.lessons) {
    if (!byTerm.has(lesson.term)) byTerm.set(lesson.term, []);
    byTerm.get(lesson.term)!.push(lesson);
  }

  const terms: RealImportTermResult[] = [];

  for (const [termLabel, lessons] of byTerm) {
    const [term] = (await sql`
      INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label, source_verified, source_note, ongoing_card)
      VALUES (${className}, ${subject}, ${termLabel}, ${frameworkLabel}, NULL, ${data.curriculum.note}, ${ongoingCardJson}::jsonb)
      ON CONFLICT (class_name, subject, term_label) DO UPDATE SET
        framework_label = EXCLUDED.framework_label,
        source_verified = EXCLUDED.source_verified,
        source_note = EXCLUDED.source_note,
        ongoing_card = EXCLUDED.ongoing_card
      RETURNING id
    `) as unknown as { id: number }[];
    const termId = term.id;

    await sql`DELETE FROM curriculum_term_units WHERE term_id = ${termId}`;

    let topicSortOrder = 0;
    for (const [i, strand] of data.curriculum.strands.entries()) {
      const strandRef = `strand-${i + 1}`;
      await upsertSyllabusTopic(termId, { ref: strandRef, parentRef: null, title: strand.title, sortOrder: topicSortOrder++ });
      for (const obj of strand.objectives) {
        await upsertSyllabusTopic(termId, { ref: obj.ref, parentRef: strandRef, title: obj.title, sortOrder: topicSortOrder++ });
      }
    }

    const unitOrder: string[] = [];
    const lessonsByUnit = new Map<string, RealLesson[]>();
    for (const lesson of lessons) {
      if (!lessonsByUnit.has(lesson.unit)) {
        unitOrder.push(lesson.unit);
        lessonsByUnit.set(lesson.unit, []);
      }
      lessonsByUnit.get(lesson.unit)!.push(lesson);
    }

    let unitsCreated = 0;
    let lessonsCreated = 0;
    let unitSortOrder = 0;
    for (const unitTitle of unitOrder) {
      const unitLessons = lessonsByUnit.get(unitTitle)!;
      const unitMeta = data.units.find((u) => u.title === unitTitle);
      const descriptionParts = [
        unitMeta?.vocabulary ? `Vocabulary: ${unitMeta.vocabulary}.` : null,
        unitMeta?.materials ? `Materials: ${unitMeta.materials}.` : null,
      ].filter((p): p is string => Boolean(p));

      const [unitRow] = (await sql`
        INSERT INTO curriculum_term_units (term_id, sort_order, title, description)
        VALUES (${termId}, ${unitSortOrder}, ${unitTitle}, ${descriptionParts.join(' ') || null})
        RETURNING id
      `) as unknown as { id: number }[];
      unitSortOrder++;
      unitsCreated++;

      let lessonSortOrder = 0;
      for (const lesson of unitLessons) {
        await sql`
          INSERT INTO curriculum_unit_lessons
            (unit_id, sort_order, title, objectives, review_status, phase, syllabus_ref, lesson_date, real_plan, real_worksheet)
          VALUES (
            ${unitRow.id}, ${lessonSortOrder}, ${lesson.title}, ${objectivesTextFor(lesson)},
            'needs_review', ${PHASE_MAP[lesson.phase]}, ${lesson.refs.join(', ') || null},
            ${lesson.date}, ${JSON.stringify(lesson.plan)}::jsonb, ${JSON.stringify(lesson.worksheet)}::jsonb
          )
        `;
        lessonSortOrder++;
        lessonsCreated++;
      }
    }

    terms.push({ termLabel, termId, unitsCreated, lessonsCreated });
  }

  return { className, subject, terms };
}
