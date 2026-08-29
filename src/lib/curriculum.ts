import { sql } from '@/lib/db';
import type { InteractiveLessonContent, TeachingScript, VideoSource } from '@/lib/interactive-content-types';

export interface CurriculumTerm {
  id: number;
  class_name: string;
  subject: string;
  term_label: string;
  framework_label: string | null;
}

export interface CurriculumLessonResource {
  id: number;
  lesson_id: number;
  title: string;
  url: string;
}

export type QuizType = 'starter' | 'exit';

export interface CurriculumQuizQuestion {
  id: number;
  lesson_id: number;
  quiz_type: QuizType;
  sort_order: number;
  question: string;
  options: string[];
  correct_option_index: number;
  hint: string | null;
}

export type LessonReviewStatus = 'needs_review' | 'published';

/** What kind of teaching slot a lesson is -- mirrors the phases a real exam-board pacing plan
 * moves through (new content, consolidation, exam technique, sitting past papers, flex slots),
 * not just "lesson vs quiz." Drives the Full Sequence view's filter chips and phase pills. */
export type LessonPhase = 'content' | 'review' | 'revision' | 'exam_skill' | 'past_paper' | 'buffer';

export interface CurriculumFlashcard {
  id: number;
  lesson_id: number;
  sort_order: number;
  term: string;
  definition: string;
}

export interface CurriculumLesson {
  id: number;
  unit_id: number;
  sort_order: number;
  title: string;
  objectives: string | null;
  worksheet_url: string | null;
  worksheet_title: string | null;
  video_url: string | null;
  video_title: string | null;
  video_source: VideoSource | null;
  equipment_note: string | null;
  /** Rendered by InteractiveLessonStepper in place of the plain view below when present. Already
   * has any per-child personalization overlaid where the caller asked for it (see
   * getLessonForOnlineFlow's childId param) — never the base row's raw value in that case. */
  interactive_content: InteractiveLessonContent | null;
  teaching_script: TeachingScript | null;
  review_status: LessonReviewStatus;
  phase: LessonPhase;
  /** Free text, e.g. "2.4.3 / 2.5" -- can name more than one syllabus point. Matched against
   * curriculum_syllabus_topics.ref by loose prefix, not a foreign key (see that table's schema
   * comment in db.ts). */
  syllabus_ref: string | null;
  occurrence_id: number | null;
  /** Denormalized from schedule_session_occurrences at read time (see getCurriculumTermTree) --
   * null whenever occurrence_id is null or points at a since-cancelled occurrence. */
  occurrence_date: string | null;
  occurrence_starts_at: string | null;
  taught: boolean;
  taught_at: string | null;
  flagged_for_reteach: boolean;
  resources: CurriculumLessonResource[];
  starter_quiz: CurriculumQuizQuestion[];
  exit_quiz: CurriculumQuizQuestion[];
  flashcards: CurriculumFlashcard[];
}

export interface CurriculumUnit {
  id: number;
  term_id: number;
  sort_order: number;
  title: string;
  description: string | null;
  lessons: CurriculumLesson[];
}

export interface CurriculumTermTree extends CurriculumTerm {
  units: CurriculumUnit[];
}

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export async function getCurriculumTermsForClass(className: string | null): Promise<CurriculumTerm[]> {
  if (!className) return [];
  return (await sql`
    SELECT id, class_name, subject, term_label, framework_label
    FROM curriculum_terms WHERE class_name = ${className}
    ORDER BY subject, term_label
  `) as unknown as CurriculumTerm[];
}

export async function getCurriculumTermsForClasses(classNames: string[]): Promise<CurriculumTerm[]> {
  if (classNames.length === 0) return [];
  return (await sql`
    SELECT id, class_name, subject, term_label, framework_label
    FROM curriculum_terms WHERE class_name = ANY(${classNames})
    ORDER BY class_name, subject, term_label
  `) as unknown as CurriculumTerm[];
}

/** Unlike getCurriculumTermsForClasses, not scoped to any class list — admins need to be able to
 * find and fix a programme even if its class_name was typed (or imported) with a value that
 * doesn't exactly match any current child's class, since class_name is free text rather than a
 * foreign key and a mismatch would otherwise make the programme invisible to everyone. */
export async function getAllCurriculumTerms(): Promise<CurriculumTerm[]> {
  return (await sql`
    SELECT id, class_name, subject, term_label, framework_label
    FROM curriculum_terms
    ORDER BY class_name, subject, term_label
  `) as unknown as CurriculumTerm[];
}

/** The full term -> units -> lessons -> resources tree in five queries total (not one per unit/
 * lesson), assembled in memory — a term's whole content is small (a handful of units, a few dozen
 * lessons at most), so this is simpler and just as fast as a single deeply-joined query.
 *
 * includeNeedsReview defaults to false (parent/student/teacher-browsing callers): a
 * generation-engine lesson stuck in 'needs_review' is filtered out entirely, exactly as if it
 * didn't exist yet, until a teacher publishes it. Pass true only for the authoring page, which
 * needs to see (and act on) needs_review lessons. */
export async function getCurriculumTermTree(termId: number, includeNeedsReview = false): Promise<CurriculumTermTree | null> {
  const [term] = (await sql`
    SELECT id, class_name, subject, term_label, framework_label FROM curriculum_terms WHERE id = ${termId}
  `) as unknown as CurriculumTerm[];
  if (!term) return null;

  const units = (await sql`
    SELECT id, term_id, sort_order, title, description FROM curriculum_term_units
    WHERE term_id = ${termId} ORDER BY sort_order, id
  `) as unknown as Omit<CurriculumUnit, 'lessons'>[];
  const unitIds = units.map((u) => u.id);

  const allLessons =
    unitIds.length === 0
      ? []
      : ((await sql`
          SELECT l.id, l.unit_id, l.sort_order, l.title, l.objectives, l.worksheet_url, l.worksheet_title,
                 l.video_url, l.video_title, l.video_source, l.equipment_note, l.interactive_content, l.teaching_script,
                 l.review_status, l.phase, l.syllabus_ref, l.occurrence_id, l.taught, l.taught_at::text,
                 l.flagged_for_reteach,
                 CASE WHEN o.is_cancelled THEN NULL ELSE o.occurrence_date::text END AS occurrence_date,
                 CASE WHEN o.is_cancelled THEN NULL ELSE o.starts_at::text END AS occurrence_starts_at
          FROM curriculum_unit_lessons l
          LEFT JOIN schedule_session_occurrences o ON o.id = l.occurrence_id
          WHERE l.unit_id = ANY(${unitIds}) ORDER BY l.sort_order, l.id
        `) as unknown as Omit<CurriculumLesson, 'resources' | 'starter_quiz' | 'exit_quiz' | 'flashcards'>[]);
  const lessons = includeNeedsReview ? allLessons : allLessons.filter((l) => l.review_status === 'published');
  const lessonIds = lessons.map((l) => l.id);

  const [resources, quizQuestions, flashcards] = await Promise.all([
    lessonIds.length === 0
      ? Promise.resolve([])
      : ((sql`
          SELECT id, lesson_id, title, url FROM curriculum_lesson_resources
          WHERE lesson_id = ANY(${lessonIds}) ORDER BY id
        `) as unknown as Promise<CurriculumLessonResource[]>),
    lessonIds.length === 0
      ? Promise.resolve([])
      : ((sql`
          SELECT id, lesson_id, quiz_type, sort_order, question, options, correct_option_index, hint
          FROM curriculum_lesson_quiz_questions
          WHERE lesson_id = ANY(${lessonIds}) ORDER BY quiz_type, sort_order, id
        `) as unknown as Promise<CurriculumQuizQuestion[]>),
    lessonIds.length === 0
      ? Promise.resolve([])
      : ((sql`
          SELECT id, lesson_id, sort_order, term, definition FROM curriculum_lesson_flashcards
          WHERE lesson_id = ANY(${lessonIds}) ORDER BY sort_order, id
        `) as unknown as Promise<CurriculumFlashcard[]>),
  ]);

  const resourcesByLesson = new Map<number, CurriculumLessonResource[]>();
  for (const r of resources) resourcesByLesson.set(r.lesson_id, [...(resourcesByLesson.get(r.lesson_id) ?? []), r]);

  const starterQuizByLesson = new Map<number, CurriculumQuizQuestion[]>();
  const exitQuizByLesson = new Map<number, CurriculumQuizQuestion[]>();
  for (const q of quizQuestions) {
    const map = q.quiz_type === 'starter' ? starterQuizByLesson : exitQuizByLesson;
    map.set(q.lesson_id, [...(map.get(q.lesson_id) ?? []), q]);
  }

  const flashcardsByLesson = new Map<number, CurriculumFlashcard[]>();
  for (const f of flashcards) flashcardsByLesson.set(f.lesson_id, [...(flashcardsByLesson.get(f.lesson_id) ?? []), f]);

  const lessonsByUnit = new Map<number, CurriculumLesson[]>();
  for (const l of lessons) {
    const full: CurriculumLesson = {
      ...l,
      resources: resourcesByLesson.get(l.id) ?? [],
      starter_quiz: starterQuizByLesson.get(l.id) ?? [],
      exit_quiz: exitQuizByLesson.get(l.id) ?? [],
      flashcards: flashcardsByLesson.get(l.id) ?? [],
    };
    lessonsByUnit.set(l.unit_id, [...(lessonsByUnit.get(l.unit_id) ?? []), full]);
  }

  return { ...term, units: units.map((u) => ({ ...u, lessons: lessonsByUnit.get(u.id) ?? [] })) };
}

/** Standalone lesson lookup (with its quiz questions and parent unit/term context) for the
 * self-directed "Complete online" flow's own route -- unlike getCurriculumTermTree, this loads
 * just one lesson rather than a whole programme, since the online-flow page is reached directly
 * (deep link / browser back-forward), not by walking the term tree client-side.
 *
 * Unconditionally published-only (unlike getCurriculumTermTree, there's no includeNeedsReview
 * here) -- this backs the actual student-facing "complete this lesson" experience, so a
 * needs_review lesson is treated as not found rather than served half-checked.
 *
 * childId, when given, overlays that child's row from curriculum_unit_lesson_personalizations
 * onto interactive_content if one exists -- the base lesson's own interactive_content is never
 * returned in that case, per the "render that instead of the base content" rule. */
export async function getLessonForOnlineFlow(
  lessonId: number,
  childId?: number
): Promise<{ lesson: CurriculumLesson; unitTitle: string; term: CurriculumTerm } | null> {
  const rows = (await sql`
    SELECT
      l.id, l.unit_id, l.sort_order, l.title, l.objectives, l.worksheet_url, l.worksheet_title,
      l.video_url, l.video_title, l.video_source, l.equipment_note, l.interactive_content, l.teaching_script, l.review_status,
      l.phase, l.syllabus_ref, l.occurrence_id, l.taught, l.taught_at::text, l.flagged_for_reteach,
      u.title AS unit_title,
      t.id AS term_id, t.class_name, t.subject, t.term_label, t.framework_label
    FROM curriculum_unit_lessons l
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms t ON t.id = u.term_id
    WHERE l.id = ${lessonId}
  `) as unknown as (Omit<CurriculumLesson, 'resources' | 'starter_quiz' | 'exit_quiz' | 'flashcards'> & {
    unit_title: string;
    term_id: number;
    class_name: string;
    subject: string;
    term_label: string;
    framework_label: string | null;
  })[];
  const row = rows[0];
  if (!row || row.review_status !== 'published') return null;

  const [resources, quizQuestions, flashcards, personalization] = await Promise.all([
    (sql`
      SELECT id, lesson_id, title, url FROM curriculum_lesson_resources WHERE lesson_id = ${lessonId} ORDER BY id
    `) as unknown as Promise<CurriculumLessonResource[]>,
    (sql`
      SELECT id, lesson_id, quiz_type, sort_order, question, options, correct_option_index, hint
      FROM curriculum_lesson_quiz_questions WHERE lesson_id = ${lessonId} ORDER BY quiz_type, sort_order, id
    `) as unknown as Promise<CurriculumQuizQuestion[]>,
    (sql`
      SELECT id, lesson_id, sort_order, term, definition FROM curriculum_lesson_flashcards
      WHERE lesson_id = ${lessonId} ORDER BY sort_order, id
    `) as unknown as Promise<CurriculumFlashcard[]>,
    childId
      ? ((sql`
          SELECT personalized_content FROM curriculum_unit_lesson_personalizations
          WHERE lesson_id = ${lessonId} AND child_id = ${childId}
        `) as unknown as Promise<{ personalized_content: InteractiveLessonContent }[]>)
      : Promise.resolve([]),
  ]);

  const lesson: CurriculumLesson = {
    id: row.id,
    unit_id: row.unit_id,
    sort_order: row.sort_order,
    title: row.title,
    objectives: row.objectives,
    worksheet_url: row.worksheet_url,
    worksheet_title: row.worksheet_title,
    video_url: row.video_url,
    video_title: row.video_title,
    video_source: row.video_source,
    equipment_note: row.equipment_note,
    interactive_content: personalization[0]?.personalized_content ?? row.interactive_content,
    teaching_script: row.teaching_script,
    review_status: row.review_status,
    phase: row.phase,
    syllabus_ref: row.syllabus_ref,
    occurrence_id: row.occurrence_id,
    // Not joined here -- the online flow never displays a lesson's real-world date, only the
    // planning dashboard does (see getCurriculumTermTree, which does join it).
    occurrence_date: null,
    occurrence_starts_at: null,
    taught: row.taught,
    taught_at: row.taught_at,
    flagged_for_reteach: row.flagged_for_reteach,
    resources,
    starter_quiz: quizQuestions.filter((q) => q.quiz_type === 'starter'),
    exit_quiz: quizQuestions.filter((q) => q.quiz_type === 'exit'),
    flashcards,
  };

  return {
    lesson,
    unitTitle: row.unit_title,
    term: { id: row.term_id, class_name: row.class_name, subject: row.subject, term_label: row.term_label, framework_label: row.framework_label },
  };
}

/** lessonId -> status, for every lesson a child has progress recorded on. A lesson with no row
 * here is implicitly 'not_started' — callers default missing entries themselves rather than this
 * function inserting placeholder rows. */
export async function getProgressMapForChild(childId: number): Promise<Map<number, LessonProgressStatus>> {
  const rows = (await sql`
    SELECT lesson_id, status FROM child_lesson_progress WHERE child_id = ${childId}
  `) as unknown as { lesson_id: number; status: LessonProgressStatus }[];
  return new Map(rows.map((r) => [r.lesson_id, r.status]));
}

/** Same shape as getProgressMapForChild, for every child in one class at once — backs the
 * authoring page's per-lesson "class progress" list, so a teacher can see and set every one of
 * their students' progress without a round trip per child. */
export async function getProgressMapForChildren(childIds: number[]): Promise<Map<number, Map<number, LessonProgressStatus>>> {
  if (childIds.length === 0) return new Map();
  const rows = (await sql`
    SELECT child_id, lesson_id, status FROM child_lesson_progress WHERE child_id = ANY(${childIds})
  `) as unknown as { child_id: number; lesson_id: number; status: LessonProgressStatus }[];
  const map = new Map<number, Map<number, LessonProgressStatus>>();
  for (const r of rows) {
    if (!map.has(r.child_id)) map.set(r.child_id, new Map());
    map.get(r.child_id)!.set(r.lesson_id, r.status);
  }
  return map;
}

/** A parent or a teacher/admin can freely set this (agreed scope), so the caller passes exactly
 * one of adminUserId/customerId identifying who made the change — never more than one, never none.
 * A student can also cause this to be set to 'completed', but only as a side effect of actually
 * finishing the exit quiz in the online flow (see upsertOnlineProgressStep) — never through this
 * function directly with studentAccountId set, since students don't get free-form status editing. */
export async function setChildLessonProgress(
  childId: number,
  lessonId: number,
  status: LessonProgressStatus,
  actor: { adminUserId?: number; customerId?: number; studentAccountId?: number }
): Promise<void> {
  await sql`
    INSERT INTO child_lesson_progress
      (child_id, lesson_id, status, updated_by_admin_user_id, updated_by_customer_id, updated_by_student_account_id, updated_at)
    VALUES (${childId}, ${lessonId}, ${status}, ${actor.adminUserId ?? null}, ${actor.customerId ?? null}, ${actor.studentAccountId ?? null}, now())
    ON CONFLICT (child_id, lesson_id) DO UPDATE SET
      status = EXCLUDED.status,
      updated_by_admin_user_id = EXCLUDED.updated_by_admin_user_id,
      updated_by_customer_id = EXCLUDED.updated_by_customer_id,
      updated_by_student_account_id = EXCLUDED.updated_by_student_account_id,
      updated_at = now()
  `;
}

export interface ChildLessonOnlineProgress {
  intro_done: boolean;
  starter_quiz_score: number | null;
  starter_quiz_total: number | null;
  video_done: boolean;
  exit_quiz_score: number | null;
  exit_quiz_total: number | null;
  completed_at: string | null;
}

const EMPTY_ONLINE_PROGRESS: ChildLessonOnlineProgress = {
  intro_done: false,
  starter_quiz_score: null,
  starter_quiz_total: null,
  video_done: false,
  exit_quiz_score: null,
  exit_quiz_total: null,
  completed_at: null,
};

/** No row yet just means nothing's been done — same "missing means not started" convention as
 * getProgressMapForChild, rather than a route having to special-case a null result. */
export async function getOnlineProgress(childId: number, lessonId: number): Promise<ChildLessonOnlineProgress> {
  const rows = (await sql`
    SELECT intro_done, starter_quiz_score, starter_quiz_total, video_done, exit_quiz_score, exit_quiz_total, completed_at
    FROM child_lesson_online_progress WHERE child_id = ${childId} AND lesson_id = ${lessonId}
  `) as unknown as ChildLessonOnlineProgress[];
  return rows[0] ?? EMPTY_ONLINE_PROGRESS;
}

export type OnlineProgressStep =
  | { step: 'intro' }
  | { step: 'video' }
  | { step: 'starter_quiz'; score: number; total: number }
  | { step: 'exit_quiz'; score: number; total: number }
  /** Finishing InteractiveLessonStepper's last step, for a lesson with interactive_content --
   * the stepper doesn't have separate intro/starter/video/exit milestones, so this is the one
   * signal it sends, and it's treated exactly like exit_quiz below (marks completed_at and
   * cascades to child_lesson_progress = 'completed'). */
  | { step: 'interactive_complete' };

/** Records one step of the online flow and, only for the exit quiz (or an interactive lesson's
 * completion), also marks the lesson 'completed' in the same shared child_lesson_progress status
 * every other view reads (see setChildLessonProgress's own comment on why a student is allowed to
 * trigger that here but nowhere else). Starting the flow (finishing the intro) nudges a still-
 * 'not_started' lesson to 'in_progress', mirroring Oak's "Activate" framing for the starter quiz. */
export async function upsertOnlineProgressStep(
  childId: number,
  lessonId: number,
  update: OnlineProgressStep,
  actor: { adminUserId?: number; customerId?: number; studentAccountId?: number }
): Promise<void> {
  const current = await getOnlineProgress(childId, lessonId);

  const next: ChildLessonOnlineProgress = { ...current };
  if (update.step === 'intro') next.intro_done = true;
  if (update.step === 'video') next.video_done = true;
  if (update.step === 'starter_quiz') {
    next.starter_quiz_score = update.score;
    next.starter_quiz_total = update.total;
  }
  if (update.step === 'exit_quiz') {
    next.exit_quiz_score = update.score;
    next.exit_quiz_total = update.total;
    next.completed_at = new Date().toISOString();
  }
  if (update.step === 'interactive_complete') {
    next.completed_at = new Date().toISOString();
  }

  await sql`
    INSERT INTO child_lesson_online_progress
      (child_id, lesson_id, intro_done, starter_quiz_score, starter_quiz_total, video_done, exit_quiz_score, exit_quiz_total, completed_at, updated_at)
    VALUES (
      ${childId}, ${lessonId}, ${next.intro_done}, ${next.starter_quiz_score}, ${next.starter_quiz_total},
      ${next.video_done}, ${next.exit_quiz_score}, ${next.exit_quiz_total}, ${next.completed_at}, now()
    )
    ON CONFLICT (child_id, lesson_id) DO UPDATE SET
      intro_done = EXCLUDED.intro_done,
      starter_quiz_score = EXCLUDED.starter_quiz_score,
      starter_quiz_total = EXCLUDED.starter_quiz_total,
      video_done = EXCLUDED.video_done,
      exit_quiz_score = EXCLUDED.exit_quiz_score,
      exit_quiz_total = EXCLUDED.exit_quiz_total,
      completed_at = EXCLUDED.completed_at,
      updated_at = now()
  `;

  if (update.step === 'exit_quiz' || update.step === 'interactive_complete') {
    await setChildLessonProgress(childId, lessonId, 'completed', actor);
  } else {
    const rows = await sql`SELECT status FROM child_lesson_progress WHERE child_id = ${childId} AND lesson_id = ${lessonId}`;
    const currentStatus = (rows[0]?.status as LessonProgressStatus | undefined) ?? 'not_started';
    if (currentStatus === 'not_started') {
      await setChildLessonProgress(childId, lessonId, 'in_progress', actor);
    }
  }
}

/** The first lesson (in unit/lesson order) that isn't marked completed — "what's my child doing
 * right now" for a quick-glance summary, without storing a redundant pointer that could drift out
 * of sync with the actual per-lesson progress rows. Null once every lesson is completed. */
export function currentLessonId(term: CurriculumTermTree, progress: Map<number, LessonProgressStatus>): number | null {
  for (const unit of term.units) {
    for (const lesson of unit.lessons) {
      if ((progress.get(lesson.id) ?? 'not_started') !== 'completed') return lesson.id;
    }
  }
  return null;
}

/** Flips a generated lesson's review gate -- 'published' is the only status a teacher can set
 * through this (there's no UI path back to needs_review; a teacher who wants to redo a lesson
 * edits or deletes it instead), so this only ever moves one direction. See review_status's own
 * schema comment in db.ts for why the default is 'published' and only generation-engine inserts
 * ever start a lesson at 'needs_review'. */
export async function publishLesson(lessonId: number): Promise<void> {
  await sql`UPDATE curriculum_unit_lessons SET review_status = 'published' WHERE id = ${lessonId}`;
}

/** Every lesson in a term, in one flat teaching order (unit order, then lesson order within each
 * unit) -- what the planning dashboard's Home/Full Sequence views actually work from, since a
 * teacher thinks in terms of "lesson 14 of 74," not which unit it happens to sit in. */
export function flattenLessons(term: CurriculumTermTree): CurriculumLesson[] {
  return term.units.flatMap((u) => u.lessons);
}

export interface SyllabusTopicRow {
  id: number;
  term_id: number;
  ref: string;
  parent_ref: string | null;
  title: string;
  known: boolean;
  sort_order: number;
}

export async function getSyllabusTopicsForTerm(termId: number): Promise<SyllabusTopicRow[]> {
  return (await sql`
    SELECT id, term_id, ref, parent_ref, title, known, sort_order
    FROM curriculum_syllabus_topics WHERE term_id = ${termId} ORDER BY sort_order, ref
  `) as unknown as SyllabusTopicRow[];
}

export async function setSyllabusTopicKnown(id: number, known: boolean): Promise<void> {
  await sql`UPDATE curriculum_syllabus_topics SET known = ${known} WHERE id = ${id}`;
}

/** Upserts on (term_id, ref) so re-running a syllabus import (or re-generating a term) doesn't
 * duplicate topics that already exist -- matches ON CONFLICT usage elsewhere in this file (see the
 * term insert in generate.ts). Never touches `known` on conflict: that's a live teaching signal a
 * teacher sets from the dashboard, not something a re-import should silently reset. */
export async function upsertSyllabusTopic(
  termId: number,
  input: { ref: string; parentRef: string | null; title: string; sortOrder: number }
): Promise<void> {
  await sql`
    INSERT INTO curriculum_syllabus_topics (term_id, ref, parent_ref, title, sort_order)
    VALUES (${termId}, ${input.ref}, ${input.parentRef}, ${input.title}, ${input.sortOrder})
    ON CONFLICT (term_id, ref) DO UPDATE SET
      parent_ref = EXCLUDED.parent_ref, title = EXCLUDED.title, sort_order = EXCLUDED.sort_order
  `;
}

export interface AssignableOccurrenceRow {
  occurrence_id: number;
  occurrence_date: string;
  starts_at: string;
  already_assigned_lesson_title: string | null;
}

/** Real, not-cancelled class occurrences for one class+subject from today onward -- the picker
 * list a teacher assigns a lesson's occurrence_id from. Includes occurrences another lesson is
 * already pinned to (flagged via already_assigned_lesson_title) rather than hiding them, since
 * re-pinning a slot to a different lesson is a legitimate re-plan, not an error. */
export async function getAssignableOccurrences(className: string, subject: string): Promise<AssignableOccurrenceRow[]> {
  return (await sql`
    SELECT o.id AS occurrence_id, o.occurrence_date::text, o.starts_at::text,
      l.title AS already_assigned_lesson_title
    FROM schedule_session_occurrences o
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    LEFT JOIN curriculum_unit_lessons l ON l.occurrence_id = o.id
    WHERE cs.class_name = ${className} AND cs.subject = ${subject}
      AND o.is_cancelled = false AND o.occurrence_date >= CURRENT_DATE
    ORDER BY o.starts_at
    LIMIT 200
  `) as unknown as AssignableOccurrenceRow[];
}
