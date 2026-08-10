import { sql } from '@/lib/db';

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
  equipment_note: string | null;
  resources: CurriculumLessonResource[];
  starter_quiz: CurriculumQuizQuestion[];
  exit_quiz: CurriculumQuizQuestion[];
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

/** The full term -> units -> lessons -> resources tree in four queries total (not one per unit/
 * lesson), assembled in memory — a term's whole content is small (a handful of units, a few dozen
 * lessons at most), so this is simpler and just as fast as a single deeply-joined query. */
export async function getCurriculumTermTree(termId: number): Promise<CurriculumTermTree | null> {
  const [term] = (await sql`
    SELECT id, class_name, subject, term_label, framework_label FROM curriculum_terms WHERE id = ${termId}
  `) as unknown as CurriculumTerm[];
  if (!term) return null;

  const units = (await sql`
    SELECT id, term_id, sort_order, title, description FROM curriculum_term_units
    WHERE term_id = ${termId} ORDER BY sort_order, id
  `) as unknown as Omit<CurriculumUnit, 'lessons'>[];
  const unitIds = units.map((u) => u.id);

  const lessons =
    unitIds.length === 0
      ? []
      : ((await sql`
          SELECT id, unit_id, sort_order, title, objectives, worksheet_url, worksheet_title,
                 video_url, video_title, equipment_note
          FROM curriculum_unit_lessons WHERE unit_id = ANY(${unitIds}) ORDER BY sort_order, id
        `) as unknown as Omit<CurriculumLesson, 'resources' | 'starter_quiz' | 'exit_quiz'>[]);
  const lessonIds = lessons.map((l) => l.id);

  const [resources, quizQuestions] = await Promise.all([
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
  ]);

  const resourcesByLesson = new Map<number, CurriculumLessonResource[]>();
  for (const r of resources) resourcesByLesson.set(r.lesson_id, [...(resourcesByLesson.get(r.lesson_id) ?? []), r]);

  const starterQuizByLesson = new Map<number, CurriculumQuizQuestion[]>();
  const exitQuizByLesson = new Map<number, CurriculumQuizQuestion[]>();
  for (const q of quizQuestions) {
    const map = q.quiz_type === 'starter' ? starterQuizByLesson : exitQuizByLesson;
    map.set(q.lesson_id, [...(map.get(q.lesson_id) ?? []), q]);
  }

  const lessonsByUnit = new Map<number, CurriculumLesson[]>();
  for (const l of lessons) {
    const full: CurriculumLesson = {
      ...l,
      resources: resourcesByLesson.get(l.id) ?? [],
      starter_quiz: starterQuizByLesson.get(l.id) ?? [],
      exit_quiz: exitQuizByLesson.get(l.id) ?? [],
    };
    lessonsByUnit.set(l.unit_id, [...(lessonsByUnit.get(l.unit_id) ?? []), full]);
  }

  return { ...term, units: units.map((u) => ({ ...u, lessons: lessonsByUnit.get(u.id) ?? [] })) };
}

/** Standalone lesson lookup (with its quiz questions and parent unit/term context) for the
 * self-directed "Complete online" flow's own route -- unlike getCurriculumTermTree, this loads
 * just one lesson rather than a whole programme, since the online-flow page is reached directly
 * (deep link / browser back-forward), not by walking the term tree client-side. */
export async function getLessonForOnlineFlow(
  lessonId: number
): Promise<{ lesson: CurriculumLesson; unitTitle: string; term: CurriculumTerm } | null> {
  const rows = (await sql`
    SELECT
      l.id, l.unit_id, l.sort_order, l.title, l.objectives, l.worksheet_url, l.worksheet_title,
      l.video_url, l.video_title, l.equipment_note,
      u.title AS unit_title,
      t.id AS term_id, t.class_name, t.subject, t.term_label, t.framework_label
    FROM curriculum_unit_lessons l
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms t ON t.id = u.term_id
    WHERE l.id = ${lessonId}
  `) as unknown as (Omit<CurriculumLesson, 'resources' | 'starter_quiz' | 'exit_quiz'> & {
    unit_title: string;
    term_id: number;
    class_name: string;
    subject: string;
    term_label: string;
    framework_label: string | null;
  })[];
  const row = rows[0];
  if (!row) return null;

  const [resources, quizQuestions] = await Promise.all([
    (sql`
      SELECT id, lesson_id, title, url FROM curriculum_lesson_resources WHERE lesson_id = ${lessonId} ORDER BY id
    `) as unknown as Promise<CurriculumLessonResource[]>,
    (sql`
      SELECT id, lesson_id, quiz_type, sort_order, question, options, correct_option_index, hint
      FROM curriculum_lesson_quiz_questions WHERE lesson_id = ${lessonId} ORDER BY quiz_type, sort_order, id
    `) as unknown as Promise<CurriculumQuizQuestion[]>,
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
    equipment_note: row.equipment_note,
    resources,
    starter_quiz: quizQuestions.filter((q) => q.quiz_type === 'starter'),
    exit_quiz: quizQuestions.filter((q) => q.quiz_type === 'exit'),
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
  | { step: 'exit_quiz'; score: number; total: number };

/** Records one step of the online flow and, only for the exit quiz, also marks the lesson
 * 'completed' in the same shared child_lesson_progress status every other view reads (see
 * setChildLessonProgress's own comment on why a student is allowed to trigger that here but
 * nowhere else). Starting the flow (finishing the intro) nudges a still-'not_started' lesson to
 * 'in_progress', mirroring Oak's "Activate" framing for the starter quiz. */
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

  if (update.step === 'exit_quiz') {
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
