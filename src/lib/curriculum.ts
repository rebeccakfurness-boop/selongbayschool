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

export interface CurriculumLesson {
  id: number;
  unit_id: number;
  sort_order: number;
  title: string;
  objectives: string | null;
  worksheet_url: string | null;
  worksheet_title: string | null;
  resources: CurriculumLessonResource[];
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
          SELECT id, unit_id, sort_order, title, objectives, worksheet_url, worksheet_title
          FROM curriculum_unit_lessons WHERE unit_id = ANY(${unitIds}) ORDER BY sort_order, id
        `) as unknown as Omit<CurriculumLesson, 'resources'>[]);
  const lessonIds = lessons.map((l) => l.id);

  const resources =
    lessonIds.length === 0
      ? []
      : ((await sql`
          SELECT id, lesson_id, title, url FROM curriculum_lesson_resources
          WHERE lesson_id = ANY(${lessonIds}) ORDER BY id
        `) as unknown as CurriculumLessonResource[]);

  const resourcesByLesson = new Map<number, CurriculumLessonResource[]>();
  for (const r of resources) resourcesByLesson.set(r.lesson_id, [...(resourcesByLesson.get(r.lesson_id) ?? []), r]);

  const lessonsByUnit = new Map<number, CurriculumLesson[]>();
  for (const l of lessons) {
    const full: CurriculumLesson = { ...l, resources: resourcesByLesson.get(l.id) ?? [] };
    lessonsByUnit.set(l.unit_id, [...(lessonsByUnit.get(l.unit_id) ?? []), full]);
  }

  return { ...term, units: units.map((u) => ({ ...u, lessons: lessonsByUnit.get(u.id) ?? [] })) };
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

/** Both a parent and a teacher/admin can call this (agreed scope), so the caller passes exactly
 * one of adminUserId/customerId identifying who made the change — never both, never neither. */
export async function setChildLessonProgress(
  childId: number,
  lessonId: number,
  status: LessonProgressStatus,
  actor: { adminUserId?: number; customerId?: number }
): Promise<void> {
  await sql`
    INSERT INTO child_lesson_progress (child_id, lesson_id, status, updated_by_admin_user_id, updated_by_customer_id, updated_at)
    VALUES (${childId}, ${lessonId}, ${status}, ${actor.adminUserId ?? null}, ${actor.customerId ?? null}, now())
    ON CONFLICT (child_id, lesson_id) DO UPDATE SET
      status = EXCLUDED.status,
      updated_by_admin_user_id = EXCLUDED.updated_by_admin_user_id,
      updated_by_customer_id = EXCLUDED.updated_by_customer_id,
      updated_at = now()
  `;
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
