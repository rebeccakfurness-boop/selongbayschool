import { sql } from './db';

export type WorksheetActorRole = 'admin' | 'parent' | 'student';

export interface WorksheetActor {
  adminUserId?: number;
  customerId?: number;
  studentAccountId?: number;
}

export interface RubricScore {
  criterion_id: number;
  label: string;
  rating: number;
}

export interface WorksheetMarkDetail {
  score: number;
  max_score: number;
  comments: string | null;
  marked_at: string;
  rubric: RubricScore[];
}

export interface WorksheetSubmissionDetail {
  submission_id: number;
  file_url: string;
  uploaded_at: string;
  uploaded_by_role: WorksheetActorRole | null;
  mark: WorksheetMarkDetail | null;
}

interface SubmissionRow {
  id: number;
  file_url: string;
  uploaded_at: string;
  uploaded_by_admin_user_id: number | null;
  uploaded_by_customer_id: number | null;
  uploaded_by_student_account_id: number | null;
}

function actorRole(row: SubmissionRow): WorksheetActorRole | null {
  if (row.uploaded_by_admin_user_id !== null) return 'admin';
  if (row.uploaded_by_customer_id !== null) return 'parent';
  if (row.uploaded_by_student_account_id !== null) return 'student';
  return null;
}

async function loadMark(submissionId: number): Promise<WorksheetMarkDetail | null> {
  const [mark] = (await sql`
    SELECT id, score, max_score, comments, marked_at::text
    FROM worksheet_marks WHERE submission_id = ${submissionId}
  `) as unknown as { id: number; score: number; max_score: number; comments: string | null; marked_at: string }[];
  if (!mark) return null;

  const rubric = (await sql`
    SELECT s.criterion_id, c.label, s.rating
    FROM worksheet_rubric_scores s
    JOIN worksheet_rubric_criteria c ON c.id = s.criterion_id
    WHERE s.mark_id = ${mark.id}
    ORDER BY c.sort_order
  `) as unknown as RubricScore[];

  return { score: mark.score, max_score: mark.max_score, comments: mark.comments, marked_at: mark.marked_at, rubric };
}

/** Resolves the format a specific child actually experiences a session in (online vs in person),
 * accounting for that child's schedule_type override the same way schedule.ts's
 * getUpcomingOccurrencesForClass does — used to gate the parent/student worksheet upload route to
 * "online" sessions per the agreed default (teacher uploads on-site work instead). Returns null if
 * the occurrence doesn't exist or the child isn't in that class at all. */
export async function getEffectiveFormatForChild(occurrenceId: number, childId: number): Promise<'online' | 'in_person' | null> {
  const rows = (await sql`
    SELECT COALESCE(ov.format_override, cs.format) AS format
    FROM schedule_session_occurrences o
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    JOIN children c ON c.id = ${childId} AND c.class_name = cs.class_name
    LEFT JOIN class_schedule_type_overrides ov ON ov.class_schedule_id = cs.id AND ov.schedule_type = c.schedule_type
    WHERE o.id = ${occurrenceId}
  `) as unknown as { format: 'online' | 'in_person' }[];
  return rows[0]?.format ?? null;
}

/** class_name of the occurrence's session — used by every worksheet route to check the requester
 * is actually allowed near this occurrence (canAccessClass for staff, matching class_name for a
 * child) before touching anything. */
export async function getClassNameForOccurrence(occurrenceId: number): Promise<string | null> {
  const rows = (await sql`
    SELECT cs.class_name FROM schedule_session_occurrences o
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    WHERE o.id = ${occurrenceId}
  `) as unknown as { class_name: string }[];
  return rows[0]?.class_name ?? null;
}

/** Same idea as getClassNameForOccurrence, one hop further — used by the mark-saving route, which
 * only has a submissionId (not an occurrenceId) to check access against. */
export async function getClassNameForSubmission(submissionId: number): Promise<string | null> {
  const rows = (await sql`
    SELECT cs.class_name
    FROM session_worksheet_submissions sub
    JOIN schedule_session_occurrences o ON o.id = sub.occurrence_id
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    WHERE sub.id = ${submissionId}
  `) as unknown as { class_name: string }[];
  return rows[0]?.class_name ?? null;
}

export async function getWorksheetForOccurrenceChild(occurrenceId: number, childId: number): Promise<WorksheetSubmissionDetail | null> {
  const [submission] = (await sql`
    SELECT id, file_url, uploaded_at::text, uploaded_by_admin_user_id, uploaded_by_customer_id, uploaded_by_student_account_id
    FROM session_worksheet_submissions WHERE occurrence_id = ${occurrenceId} AND child_id = ${childId}
  `) as unknown as SubmissionRow[];
  if (!submission) return null;

  return {
    submission_id: submission.id,
    file_url: submission.file_url,
    uploaded_at: submission.uploaded_at,
    uploaded_by_role: actorRole(submission),
    mark: await loadMark(submission.id),
  };
}

/** A re-upload replaces the file and — deliberately — clears any existing mark: the mark was
 * against the old file's content, and leaving it attached to a swapped-out worksheet would show a
 * grade that no longer corresponds to what's on screen. worksheet_rubric_scores cascades away with
 * it via its own FK. */
export async function upsertWorksheetSubmission(input: {
  occurrenceId: number;
  childId: number;
  fileUrl: string;
  actor: WorksheetActor;
}): Promise<{ id: number }> {
  const [existing] = (await sql`
    SELECT id FROM session_worksheet_submissions WHERE occurrence_id = ${input.occurrenceId} AND child_id = ${input.childId}
  `) as unknown as { id: number }[];

  if (existing) {
    await sql`DELETE FROM worksheet_marks WHERE submission_id = ${existing.id}`;
    await sql`
      UPDATE session_worksheet_submissions SET
        file_url = ${input.fileUrl},
        uploaded_by_admin_user_id = ${input.actor.adminUserId ?? null},
        uploaded_by_customer_id = ${input.actor.customerId ?? null},
        uploaded_by_student_account_id = ${input.actor.studentAccountId ?? null},
        uploaded_at = now()
      WHERE id = ${existing.id}
    `;
    return { id: existing.id };
  }

  const rows = await sql`
    INSERT INTO session_worksheet_submissions
      (occurrence_id, child_id, file_url, uploaded_by_admin_user_id, uploaded_by_customer_id, uploaded_by_student_account_id)
    VALUES (
      ${input.occurrenceId}, ${input.childId}, ${input.fileUrl},
      ${input.actor.adminUserId ?? null}, ${input.actor.customerId ?? null}, ${input.actor.studentAccountId ?? null}
    )
    RETURNING id
  `;
  return { id: rows[0].id as number };
}

export interface RosterSubmissionRow {
  child_id: number;
  child_full_name: string;
  submission_id: number | null;
  file_url: string | null;
  uploaded_at: string | null;
  score: number | null;
  max_score: number | null;
}

/** One row per active child in the occurrence's class — including children who haven't submitted
 * anything yet — so the teacher marking view reads as a class roster with worksheet status, not
 * just a list of whatever's already been uploaded. */
export async function getRosterWithSubmissionsForOccurrence(occurrenceId: number): Promise<RosterSubmissionRow[]> {
  return (await sql`
    SELECT
      c.id AS child_id, c.child_full_name,
      sub.id AS submission_id, sub.file_url, sub.uploaded_at::text,
      mark.score, mark.max_score
    FROM schedule_session_occurrences o
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    JOIN children c ON c.class_name = cs.class_name AND c.is_active = true
    LEFT JOIN session_worksheet_submissions sub ON sub.occurrence_id = o.id AND sub.child_id = c.id
    LEFT JOIN worksheet_marks mark ON mark.submission_id = sub.id
    WHERE o.id = ${occurrenceId}
    ORDER BY c.child_full_name
  `) as unknown as RosterSubmissionRow[];
}

export async function getRubricCriteria(): Promise<{ id: number; label: string }[]> {
  return (await sql`SELECT id, label FROM worksheet_rubric_criteria ORDER BY sort_order`) as unknown as { id: number; label: string }[];
}

export async function saveWorksheetMark(input: {
  submissionId: number;
  score: number;
  maxScore: number;
  comments: string | null;
  markedBy: number;
  rubricRatings: { criterionId: number; rating: number }[];
}): Promise<void> {
  const rows = await sql`
    INSERT INTO worksheet_marks (submission_id, score, max_score, comments, marked_by, marked_at)
    VALUES (${input.submissionId}, ${input.score}, ${input.maxScore}, ${input.comments}, ${input.markedBy}, now())
    ON CONFLICT (submission_id) DO UPDATE
      SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, comments = EXCLUDED.comments,
        marked_by = EXCLUDED.marked_by, marked_at = now()
    RETURNING id
  `;
  const markId = rows[0].id as number;

  await sql`DELETE FROM worksheet_rubric_scores WHERE mark_id = ${markId}`;
  for (const r of input.rubricRatings) {
    await sql`
      INSERT INTO worksheet_rubric_scores (mark_id, criterion_id, rating) VALUES (${markId}, ${r.criterionId}, ${r.rating})
    `;
  }
}

export interface GradebookEntry {
  occurrence_id: number;
  occurrence_date: string;
  subject: string;
  score: number;
  max_score: number;
  comments: string | null;
  marked_at: string;
  term_label: string | null;
}

/** Full mark history for one child across every subject/term — the parent-facing gradebook is this
 * same data, just rendered read-only (see ChildGradebookSection). term_label comes from a LATERAL
 * match against academic_terms by date rather than a stored FK, since occurrences don't carry a
 * term id of their own (see academic-calendar.ts). */
export async function getGradebookForChild(childId: number): Promise<GradebookEntry[]> {
  return (await sql`
    SELECT
      o.id AS occurrence_id, o.occurrence_date::text, cs.subject,
      m.score, m.max_score, m.comments, m.marked_at::text,
      term.label AS term_label
    FROM session_worksheet_submissions sub
    JOIN worksheet_marks m ON m.submission_id = sub.id
    JOIN schedule_session_occurrences o ON o.id = sub.occurrence_id
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    LEFT JOIN LATERAL (
      SELECT label FROM academic_terms t
      WHERE o.occurrence_date BETWEEN t.start_date AND t.end_date
      LIMIT 1
    ) term ON true
    WHERE sub.child_id = ${childId}
    ORDER BY o.occurrence_date DESC
  `) as unknown as GradebookEntry[];
}
