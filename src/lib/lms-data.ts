import { sql } from '@/lib/db';
import type { ClassBand } from '@/lib/family-data';

export interface LessonPlanRow {
  id: number;
  class_name: string;
  week_label: string;
  subject: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

export interface CurriculumUnitRow {
  id: number;
  class_name: string;
  term_label: string;
  unit_title: string;
  description: string | null;
}

export interface WorkSampleRow {
  id: number;
  title: string;
  file_url: string;
  created_at: string;
}

export interface PhotoFeedRow {
  id: number;
  file_url: string;
  caption: string | null;
  class_name: string | null;
  created_at: string;
}

export interface ResourceRow {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  class_band: ClassBand | null;
}

export interface LearningProfileSummaryRow {
  id: number;
  term_label: string;
  grade_label: string | null;
  created_at: string;
}

export interface GuardianChildRow {
  id: number;
  child_full_name: string;
  child_nickname: string | null;
  class_name: string | null;
  class_band: ClassBand | null;
}

export async function getChildrenForGuardian(customerId: number): Promise<GuardianChildRow[]> {
  return (await sql`
    SELECT c.id, c.child_full_name, c.child_nickname, c.class_name, c.class_band
    FROM guardian_children gc
    JOIN children c ON c.id = gc.child_id
    WHERE gc.customer_id = ${customerId}
    ORDER BY c.child_full_name
  `) as unknown as GuardianChildRow[];
}

export async function getUpcomingLessonPlans(className: string | null, limit = 10): Promise<LessonPlanRow[]> {
  if (!className) return [];
  return (await sql`
    SELECT id, class_name, week_label, subject, title, description, created_at
    FROM lesson_plans
    WHERE class_name = ${className}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as unknown as LessonPlanRow[];
}

export async function getCurrentCurriculumUnit(className: string | null): Promise<CurriculumUnitRow | null> {
  if (!className) return null;
  const rows = (await sql`
    SELECT id, class_name, term_label, unit_title, description
    FROM curriculum_units
    WHERE class_name = ${className} AND is_current = true
    ORDER BY created_at DESC
    LIMIT 1
  `) as unknown as CurriculumUnitRow[];
  return rows[0] ?? null;
}

export async function getWorkSamplesForChild(childId: number): Promise<WorkSampleRow[]> {
  return (await sql`
    SELECT id, title, file_url, created_at FROM work_samples
    WHERE child_id = ${childId}
    ORDER BY created_at DESC
  `) as unknown as WorkSampleRow[];
}

/** A photo counts for a child if it's tagged directly to them, or posted to their whole class
 * with no specific tags at all (a class group photo with nobody singled out). */
export async function getPhotoFeedForChild(childId: number, className: string | null, limit = 30): Promise<PhotoFeedRow[]> {
  return (await sql`
    SELECT DISTINCT p.id, p.file_url, p.caption, p.class_name, p.created_at
    FROM photo_feed_items p
    LEFT JOIN photo_feed_tags t ON t.photo_id = p.id
    WHERE t.child_id = ${childId}
       OR (p.class_name = ${className} AND NOT EXISTS (SELECT 1 FROM photo_feed_tags t2 WHERE t2.photo_id = p.id))
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `) as unknown as PhotoFeedRow[];
}

export async function getResourcesForClassBand(classBand: ClassBand | null): Promise<ResourceRow[]> {
  return (await sql`
    SELECT id, title, description, file_url, class_band
    FROM resources
    WHERE class_band IS NULL OR class_band = ${classBand}
    ORDER BY created_at DESC
  `) as unknown as ResourceRow[];
}

export async function getLearningProfilesForChild(childId: number): Promise<LearningProfileSummaryRow[]> {
  return (await sql`
    SELECT id, term_label, grade_label, created_at FROM learning_profiles
    WHERE child_id = ${childId}
    ORDER BY created_at DESC
  `) as unknown as LearningProfileSummaryRow[];
}
