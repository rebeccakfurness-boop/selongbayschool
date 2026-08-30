import { sql } from '@/lib/db';
import { upsertSyllabusTopic } from '@/lib/curriculum';
import { computeLessonPacing } from './pacing';
import { checkCalculations } from './calculation-check';
import { validateStepOrdering } from './validate';
import { generateAndAttachWorksheetFiles } from './worksheet-files';
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

export async function loadExampleContext(adminUserId?: number): Promise<ExampleContext> {
  if (!adminUserId) return { interests: [], localReferences: [] };
  const rows = (await sql`
    SELECT context_pack FROM admin_users WHERE id = ${adminUserId}
  `) as unknown as AdminUserContextRow[];
  const pack = rows[0]?.context_pack;
  return { interests: pack?.interests ?? [], localReferences: pack?.localReferences ?? [] };
}

export function flattenTopics(nodes: SyllabusTopicNode[]): SyllabusTopicNode[] {
  const flat: SyllabusTopicNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    if (node.subtopics) flat.push(...flattenTopics(node.subtopics));
  }
  return flat;
}

/** Persists the parsed syllabus's topic tree into curriculum_syllabus_topics so the planning
 * dashboard's Syllabus Map has real data without a teacher re-entering it by hand -- upsertSyllabusTopic
 * never touches `known` on conflict, so re-generating a term doesn't reset a teacher's own "already
 * known" flags. Only two levels deep (top-level topic -> subtopic) since that's what the dashboard
 * renders; a topic three levels deep would just get parent_ref pointed at its immediate parent's id,
 * which still round-trips correctly even though the dashboard only groups two levels. */
export async function persistSyllabusTopics(termId: number, nodes: SyllabusTopicNode[], parentId: string | null = null): Promise<void> {
  let sortOrder = 0;
  for (const node of nodes) {
    await upsertSyllabusTopic(termId, { ref: node.id, parentRef: parentId, title: node.title, sortOrder: sortOrder++ });
    if (node.subtopics) await persistSyllabusTopics(termId, node.subtopics, node.id);
  }
}

export interface InsertUnitCounts {
  lessonsCreated: number;
  flashcardsCreated: number;
  quizQuestionsCreated: number;
  calculationWarnings: { lessonTitle: string; warnings: string[] }[];
}

/** Inserts one generated unit and its lessons/quiz questions/flashcards, generating and attaching
 * each lesson's worksheet files (see ./worksheet-files) along the way -- the reusable body of
 * generateCurriculumTerm's own per-unit loop below, factored out so the Course Builder's
 * job-runner (src/lib/curriculum-generation/job-runner.ts) can insert exactly one unit per "step"
 * call without duplicating this SQL. Runs the same interactive-content step-ordering and
 * calculation checks generateCurriculumTerm always has -- both pipelines produce lessons that are
 * equally safe to review, never silently skipped for one caller and not the other. */
export async function insertGeneratedUnit(termId: number, sortOrder: number, unit: GeneratedUnit): Promise<InsertUnitCounts> {
  const [unitRow] = (await sql`
    INSERT INTO curriculum_term_units (term_id, sort_order, title, description)
    VALUES (${termId}, ${sortOrder}, ${unit.title}, ${unit.description ?? null})
    RETURNING id
  `) as unknown as { id: number }[];

  const calculationWarnings: { lessonTitle: string; warnings: string[] }[] = [];
  let lessonsCreated = 0;
  let flashcardsCreated = 0;
  let quizQuestionsCreated = 0;

  let lessonSortOrder = 0;
  for (const lesson of unit.lessons) {
    const problems = [
      ...validateStepOrdering(lesson.interactiveContent),
      ...(lesson.calculationChecks ? checkCalculations(lesson.calculationChecks) : []),
    ];
    if (problems.length > 0) calculationWarnings.push({ lessonTitle: lesson.title, warnings: problems });

    const [lessonRow] = (await sql`
      INSERT INTO curriculum_unit_lessons
        (unit_id, sort_order, title, objectives, interactive_content, teaching_script, review_status, phase, syllabus_ref)
      VALUES (
        ${unitRow.id}, ${lessonSortOrder}, ${lesson.title}, ${lesson.objectives},
        ${JSON.stringify(lesson.interactiveContent)}::jsonb, ${JSON.stringify(lesson.teachingScript)}::jsonb, 'needs_review',
        ${lesson.phase ?? 'content'}, ${lesson.syllabusRef ?? null}
      )
      RETURNING id
    `) as unknown as { id: number }[];
    lessonSortOrder++;
    lessonsCreated++;

    if (lesson.worksheetContent) {
      await generateAndAttachWorksheetFiles(lessonRow.id, lesson.worksheetContent, lesson.title);
    }

    let starterOrder = 0;
    let exitOrder = 0;
    for (const q of lesson.quizQuestions) {
      const questionSortOrder = q.quizType === 'starter' ? starterOrder++ : exitOrder++;
      await sql`
        INSERT INTO curriculum_lesson_quiz_questions
          (lesson_id, quiz_type, sort_order, question, options, correct_option_index, hint)
        VALUES (
          ${lessonRow.id}, ${q.quizType}, ${questionSortOrder}, ${q.question}, ${q.options}, ${q.correctOptionIndex}, ${q.hint ?? null}
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

  return { lessonsCreated, flashcardsCreated, quizQuestionsCreated, calculationWarnings };
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

  const [term] = (await sql`
    INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label, source_verified, source_note)
    VALUES (
      ${input.className}, ${input.subject}, ${input.termLabel}, ${input.frameworkLabel ?? parsedSyllabus.frameworkLabel ?? null},
      ${input.sourceVerified ?? null}, ${input.sourceNote ?? null}
    )
    ON CONFLICT (class_name, subject, term_label) DO UPDATE SET
      framework_label = EXCLUDED.framework_label,
      source_verified = EXCLUDED.source_verified,
      source_note = EXCLUDED.source_note
    RETURNING id
  `) as unknown as { id: number }[];
  const termId = term.id;

  await persistSyllabusTopics(termId, topLevelTopics);

  const existingUnitCount = (await sql`
    SELECT count(*)::int AS n FROM curriculum_term_units WHERE term_id = ${termId}
  `) as unknown as { n: number }[];
  let unitSortOrder = existingUnitCount[0]?.n ?? 0;

  let unitsCreated = 0;
  let lessonsCreated = 0;
  let flashcardsCreated = 0;
  let quizQuestionsCreated = 0;
  const calculationWarnings: { lessonTitle: string; warnings: string[] }[] = [];

  for (const unit of generatedUnits) {
    const counts = await insertGeneratedUnit(termId, unitSortOrder, unit);
    unitSortOrder++;
    unitsCreated++;
    lessonsCreated += counts.lessonsCreated;
    flashcardsCreated += counts.flashcardsCreated;
    quizQuestionsCreated += counts.quizQuestionsCreated;
    calculationWarnings.push(...counts.calculationWarnings);
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
