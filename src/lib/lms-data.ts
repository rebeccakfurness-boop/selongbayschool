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

/** Everything the parent-facing profile card shows or edits — deliberately excludes
 * enrollment/financial/immigration-status fields not asked for on that card (visa_status,
 * payment_status, tuition_plan, sibling_discount_tier, nisn_number, and every compliance-signed
 * flag stay admin/teacher-only, same as today). */
export interface GuardianChildRow {
  id: number;
  status: string;
  class_name: string | null;
  class_band: ClassBand | null;
  programme: string | null;
  child_full_name: string;
  child_nickname: string | null;
  dob: string | null;
  gender: string | null;
  nationality: string | null;
  parent1_name: string | null;
  parent1_relationship: string | null;
  parent2_name: string | null;
  parent2_relationship: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies_medical_notes: string | null;
  dietary_requirements: string | null;
  religion: string | null;
  home_language: string | null;
  previous_school: string | null;
  lunch_option: string | null;
  photo_url: string | null;
  photo_updated_by_label: string | null;
  photo_updated_at: string | null;
  passport_copy_url: string | null;
  kitas_copy_url: string | null;
  birth_certificate_url: string | null;
}

export async function getChildrenForGuardian(customerId: number): Promise<GuardianChildRow[]> {
  return (await sql`
    SELECT c.id, c.status, c.class_name, c.class_band, c.programme, c.child_full_name, c.child_nickname,
      c.dob::text, c.gender, c.nationality, c.parent1_name, c.parent1_relationship, c.parent2_name, c.parent2_relationship,
      c.primary_contact_email, c.primary_contact_phone, c.emergency_contact_name, c.emergency_contact_phone,
      c.allergies_medical_notes, c.dietary_requirements, c.religion, c.home_language, c.previous_school, c.lunch_option,
      c.photo_url, c.photo_updated_by_label, c.photo_updated_at::text,
      c.passport_copy_url, c.kitas_copy_url, c.birth_certificate_url
    FROM guardian_children gc
    JOIN children c ON c.id = gc.child_id
    WHERE gc.customer_id = ${customerId}
    ORDER BY c.child_full_name
  `) as unknown as GuardianChildRow[];
}

/** Gates every parent-facing child mutation (profile edits, document/photo uploads) — a customer
 * must have a guardian_children row for the child they're trying to touch. */
export async function guardianOwnsChild(customerId: number, childId: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM guardian_children WHERE customer_id = ${customerId} AND child_id = ${childId}
  `;
  return rows.length > 0;
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

export interface InvoiceSummaryRow {
  id: number;
  invoice_number: number;
  invoice_type: 'tuition' | 'activity';
  status: 'outstanding' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string;
  total_amount: number;
  days_overdue: number;
}

export async function getInvoicesForChild(childId: number): Promise<InvoiceSummaryRow[]> {
  return (await sql`
    SELECT
      i.id, i.invoice_number, i.invoice_type, i.status, i.issue_date::text, i.due_date::text, i.total_amount,
      GREATEST(0, (CURRENT_DATE - i.due_date))::int AS days_overdue
    FROM invoices i
    JOIN invoice_children ic ON ic.invoice_id = i.id
    WHERE ic.child_id = ${childId}
    ORDER BY i.issue_date DESC
  `) as unknown as InvoiceSummaryRow[];
}

export interface ClassroomAssignmentRow {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  alternate_link: string | null;
}

export interface ClassroomSubmissionRow {
  id: number;
  classroom_assignment_id: number;
  assignment_title: string;
  state: string;
  alternate_link: string | null;
}

export async function getClassroomAssignmentsForClass(className: string | null, limit = 10): Promise<ClassroomAssignmentRow[]> {
  if (!className) return [];
  return (await sql`
    SELECT id, title, description, due_date::text, alternate_link
    FROM classroom_assignments
    WHERE class_name = ${className}
    ORDER BY synced_at DESC
    LIMIT ${limit}
  `) as unknown as ClassroomAssignmentRow[];
}

export async function getClassroomSubmissionsForChild(childId: number): Promise<ClassroomSubmissionRow[]> {
  return (await sql`
    SELECT s.id, s.classroom_assignment_id, a.title AS assignment_title, s.state, s.alternate_link
    FROM classroom_submissions s
    JOIN classroom_assignments a ON a.id = s.classroom_assignment_id
    WHERE s.child_id = ${childId}
    ORDER BY s.synced_at DESC
  `) as unknown as ClassroomSubmissionRow[];
}

export async function getLearningProfilesForChild(childId: number): Promise<LearningProfileSummaryRow[]> {
  return (await sql`
    SELECT id, term_label, grade_label, created_at FROM learning_profiles
    WHERE child_id = ${childId}
    ORDER BY created_at DESC
  `) as unknown as LearningProfileSummaryRow[];
}
