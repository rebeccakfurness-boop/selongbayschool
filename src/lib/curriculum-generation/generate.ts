import { sql } from '@/lib/db';
import { computeLessonPacing } from './pacing';
import { checkCalculations } from './calculation-check';
import { validateStepOrdering } from './validate';
import type {
  ContentGenerationProvider,
  ExampleContext,
  GenerateCurriculumTermInput,
  GenerateCurriculumTermResult,
  GeneratedUnit,
  SyllabusTopicNode,
} from './types';

interface AdminUserContextRow {
  context_pack: { interests?: string[]; localReferences?: string[] } | null;
}

async function loadExampleContext(adminUserId?: number): Promise<ExampleContext> {
  if (!adminUserId) return { interests: [], localReferences: [] };
  const rows = (await sql`
    SELECT context_pack FROM admin_users WHERE id = ${adminUserId}
  `) as unknown as AdminUserContextRow[];
  const pack = rows[0]?.context_pack;
  return { interests: pack?.interests ?? [], localReferences: pack?.localReferences ?? [] };
}

function flattenTopics(nodes: SyllabusTopicNode[]): SyllabusTopicNode[] {
  const flat: SyllabusTopicNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    if (node.subtopics) flat.push(...flattenTopics(node.subtopics));
  }
  return flat;
}

/**
 * The full syllabus -> curriculum_terms -> curriculum_term_units -> curriculum_unit_lessons ->
 * curriculum_lesson_quiz_questions -> curriculum_lesson_flashcards pipeline for one
 * (className, subject, termLabel). Every database write here is real and runs today; only
 * `provider`'s three methods (parseSyllabus/analyzeWorkbook/generateUnit) need a real LLM behind
 * them before this can actually produce content -- generate() takes the provider as an explicit
 * argument for exactly that reason (see ContentGenerationProvider's own comment in ./types).
 * Calling this with NotConfiguredProvider (the only implementation that exists right now) throws
 * immediately and cleanly, rather than silently doing nothing.
 *
 * What "generate" means, in order:
 *  1. Parse the syllabus into its topic tree, assessment objectives, and paper/component
 *     structure.
 *  2. Compute pacing from class_schedule's real recurring slots for this class+subject, expanded
 *     against the matching academic_terms date range (computeLessonPacing) -- this decides how
 *     many lessons each unit should target; it's never a fixed count picked blind to the
 *     timetable.
 *  3. If a workbook was given, ask the provider to propose already-mastered subtopics. These are
 *     always returned in the result for a teacher to confirm (workbookMasteryProposals) -- never
 *     used here to silently skip generating a topic.
 *  4. For every top-level syllabus topic, ask the provider to generate its unit: lessons, each
 *     with objectives, interactive_content, teaching_script, starter/exit quiz questions, and
 *     flashcards.
 *  5. Validate every lesson's interactive_content step ordering (validateStepOrdering) and, for
 *     calculation-heavy lessons that supplied calculationChecks, recompute the stated worked
 *     answers (checkCalculations). Both become warnings on the result -- a wrong worked answer or
 *     a broken explanation order is exactly what needs_review exists to let a teacher catch, so
 *     neither one blocks the import.
 *  6. Upsert the term (respecting curriculum_terms' own UNIQUE (class_name, subject, term_label)
 *     constraint) and insert its units/lessons/quiz questions/flashcards. Every lesson lands with
 *     review_status = 'needs_review' -- nothing this pipeline writes is ever immediately live to
 *     a parent or student; see publishLesson in curriculum.ts for how a teacher confirms one.
 *
 * Re-running against a term that already has content (allowUpdatingExistingTerm: true) adds the
 * newly generated units to it rather than diffing against what's already there by title --
 * matching and merging existing units/lessons is real added scope beyond "build the pipeline,"
 * left as a deliberate simplification here (the same way curriculum-enrichment-seed.ts's importer
 * matches by title for its own, narrower job); re-running generation for a term you want fully
 * replaced means deleting the old units first.
 */
export async function generateCurriculumTerm(
  input: GenerateCurriculumTermInput,
  provider: ContentGenerationProvider
): Promise<GenerateCurriculumTermResult> {
  const [existingTerm] = (await sql`
    SELECT id FROM curriculum_terms
    WHERE class_name = ${input.className} AND subject = ${input.subject} AND term_label = ${input.termLabel}
  `) as unknown as { id: number }[];
  if (existingTerm && !input.allowUpdatingExistingTerm) {
    throw new Error(
      `A term already exists for ${input.className} / ${input.subject} / "${input.termLabel}" (id ${existingTerm.id}). ` +
        'Pass allowUpdatingExistingTerm: true to add generated units to it, or use a different termLabel.'
    );
  }

  const parsedSyllabus = await provider.parseSyllabus({ syllabusText: input.syllabusText, subject: input.subject });
  const pacing = await computeLessonPacing(input.className, input.subject, input.termLabel);
  const exampleContext = await loadExampleContext(input.requestedByAdminUserId);

  const topLevelTopics = parsedSyllabus.topicTree;
  const lessonCountPerUnit = Math.max(1, Math.round(pacing.sessionCount / Math.max(topLevelTopics.length, 1)));

  const workbookMasteryProposals = input.workbookText
    ? (await provider.analyzeWorkbook({ workbookText: input.workbookText, topicTree: flattenTopics(topLevelTopics) })).masterySignals
    : [];

  const generatedUnits: GeneratedUnit[] = [];
  for (const topic of topLevelTopics) {
    generatedUnits.push(
      await provider.generateUnit({
        topic,
        subject: input.subject,
        className: input.className,
        lessonCount: lessonCountPerUnit,
        exampleContext,
        assessmentObjectives: parsedSyllabus.assessmentObjectives,
      })
    );
  }

  const calculationWarnings: { lessonTitle: string; warnings: string[] }[] = [];
  for (const unit of generatedUnits) {
    for (const lesson of unit.lessons) {
      const problems = [
        ...validateStepOrdering(lesson.interactiveContent),
        ...(lesson.calculationChecks ? checkCalculations(lesson.calculationChecks) : []),
      ];
      if (problems.length > 0) calculationWarnings.push({ lessonTitle: lesson.title, warnings: problems });
    }
  }

  const [term] = (await sql`
    INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label)
    VALUES (${input.className}, ${input.subject}, ${input.termLabel}, ${input.frameworkLabel ?? parsedSyllabus.frameworkLabel ?? null})
    ON CONFLICT (class_name, subject, term_label) DO UPDATE SET framework_label = EXCLUDED.framework_label
    RETURNING id
  `) as unknown as { id: number }[];
  const termId = term.id;

  const existingUnitCount = (await sql`
    SELECT count(*)::int AS n FROM curriculum_term_units WHERE term_id = ${termId}
  `) as unknown as { n: number }[];
  let unitSortOrder = existingUnitCount[0]?.n ?? 0;

  let unitsCreated = 0;
  let lessonsCreated = 0;
  let flashcardsCreated = 0;
  let quizQuestionsCreated = 0;

  for (const unit of generatedUnits) {
    const [unitRow] = (await sql`
      INSERT INTO curriculum_term_units (term_id, sort_order, title, description)
      VALUES (${termId}, ${unitSortOrder}, ${unit.title}, ${unit.description ?? null})
      RETURNING id
    `) as unknown as { id: number }[];
    unitSortOrder++;
    unitsCreated++;

    let lessonSortOrder = 0;
    for (const lesson of unit.lessons) {
      const [lessonRow] = (await sql`
        INSERT INTO curriculum_unit_lessons
          (unit_id, sort_order, title, objectives, interactive_content, teaching_script, review_status)
        VALUES (
          ${unitRow.id}, ${lessonSortOrder}, ${lesson.title}, ${lesson.objectives},
          ${JSON.stringify(lesson.interactiveContent)}::jsonb, ${JSON.stringify(lesson.teachingScript)}::jsonb, 'needs_review'
        )
        RETURNING id
      `) as unknown as { id: number }[];
      lessonSortOrder++;
      lessonsCreated++;

      let starterOrder = 0;
      let exitOrder = 0;
      for (const q of lesson.quizQuestions) {
        const sortOrder = q.quizType === 'starter' ? starterOrder++ : exitOrder++;
        await sql`
          INSERT INTO curriculum_lesson_quiz_questions
            (lesson_id, quiz_type, sort_order, question, options, correct_option_index, hint)
          VALUES (
            ${lessonRow.id}, ${q.quizType}, ${sortOrder}, ${q.question}, ${q.options}, ${q.correctOptionIndex}, ${q.hint ?? null}
          )
        `;
        quizQuestionsCreated++;
      }

      let flashcardOrder = 0;
      for (const card of lesson.flashcards) {
        await sql`
          INSERT INTO curriculum_lesson_flashcards (lesson_id, sort_order, term, definition)
          VALUES (${lessonRow.id}, ${flashcardOrder}, ${card.term}, ${card.definition})
        `;
        flashcardOrder++;
        flashcardsCreated++;
      }
    }
  }

  return {
    termId,
    unitsCreated,
    lessonsCreated,
    flashcardsCreated,
    quizQuestionsCreated,
    pacing,
    workbookMasteryProposals,
    calculationWarnings,
  };
}
