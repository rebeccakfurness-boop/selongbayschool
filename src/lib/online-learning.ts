import { sql } from './db';
import { getCurriculumTermTree, getProgressMapForChild, flattenLessons, type CurriculumTerm, type CurriculumTermTree, type LessonProgressStatus } from './curriculum';

export interface LessonAnswerSubmission {
  id: number;
  quiz_question_id: number;
  child_id: number;
  answer_text: string | null;
  answer_audio_url: string | null;
  submitted_at: string;
  grade: string | null;
  teacher_comment: string | null;
  graded_at: string | null;
}

/** One row per (question, child) -- resubmitting overwrites the answer and clears any existing
 * grade/comment, same "re-upload clears the mark" rule as worksheet_marks, since a changed answer
 * needs a fresh look from the teacher rather than keeping a grade that no longer matches it. */
export async function submitLessonAnswer(
  childId: number,
  quizQuestionId: number,
  answer: { answerText: string | null; answerAudioUrl: string | null }
): Promise<void> {
  await sql`
    INSERT INTO curriculum_lesson_answer_submissions (quiz_question_id, child_id, answer_text, answer_audio_url)
    VALUES (${quizQuestionId}, ${childId}, ${answer.answerText}, ${answer.answerAudioUrl})
    ON CONFLICT (quiz_question_id, child_id) DO UPDATE SET
      answer_text = EXCLUDED.answer_text,
      answer_audio_url = EXCLUDED.answer_audio_url,
      submitted_at = now(),
      grade = NULL,
      teacher_comment = NULL,
      graded_by = NULL,
      graded_at = NULL
  `;
}

export async function getAnswersForChild(childId: number, quizQuestionIds: number[]): Promise<LessonAnswerSubmission[]> {
  if (quizQuestionIds.length === 0) return [];
  return (await sql`
    SELECT id, quiz_question_id, child_id, answer_text, answer_audio_url, submitted_at::text, grade, teacher_comment, graded_at::text
    FROM curriculum_lesson_answer_submissions
    WHERE child_id = ${childId} AND quiz_question_id = ANY(${quizQuestionIds})
  `) as unknown as LessonAnswerSubmission[];
}

export interface AnswerForReview extends LessonAnswerSubmission {
  question: string;
  quiz_type: 'starter' | 'exit' | 'discussion';
  lesson_id: number;
  lesson_title: string;
  child_full_name: string;
  class_name: string;
  subject: string;
}

/** The admin "Answers to review" queue -- every open_response submission, graded or not, newest
 * first. Not filtered to ungraded-only so a teacher can also revisit something they already
 * marked (e.g. to fix a comment) from the same list. */
export async function getAnswersForReview(): Promise<AnswerForReview[]> {
  return (await sql`
    SELECT s.id, s.quiz_question_id, s.child_id, s.answer_text, s.answer_audio_url, s.submitted_at::text,
      s.grade, s.teacher_comment, s.graded_at::text,
      q.question, q.quiz_type, q.lesson_id, l.title AS lesson_title,
      c.child_full_name, t.class_name, t.subject
    FROM curriculum_lesson_answer_submissions s
    JOIN curriculum_lesson_quiz_questions q ON q.id = s.quiz_question_id
    JOIN curriculum_unit_lessons l ON l.id = q.lesson_id
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms t ON t.id = u.term_id
    JOIN children c ON c.id = s.child_id
    ORDER BY s.submitted_at DESC
  `) as unknown as AnswerForReview[];
}

export async function gradeLessonAnswer(submissionId: number, grade: string | null, comment: string | null, gradedBy: number): Promise<void> {
  await sql`
    UPDATE curriculum_lesson_answer_submissions
    SET grade = ${grade}, teacher_comment = ${comment}, graded_by = ${gradedBy}, graded_at = now()
    WHERE id = ${submissionId}
  `;
}

/** For the canAccessClass gate on the grading routes -- teachers can only mark work for classes
 * they're assigned to, same rule as every other marking action in this app. */
export async function getClassNameForAnswerSubmission(submissionId: number): Promise<string | null> {
  const rows = (await sql`
    SELECT t.class_name FROM curriculum_lesson_answer_submissions s
    JOIN curriculum_lesson_quiz_questions q ON q.id = s.quiz_question_id
    JOIN curriculum_unit_lessons l ON l.id = q.lesson_id
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms t ON t.id = u.term_id
    WHERE s.id = ${submissionId}
  `) as unknown as { class_name: string }[];
  return rows[0]?.class_name ?? null;
}

export async function getClassNameForLessonWorksheetSubmission(submissionId: number): Promise<string | null> {
  const rows = (await sql`
    SELECT t.class_name FROM curriculum_lesson_worksheet_submissions s
    JOIN curriculum_unit_lessons l ON l.id = s.lesson_id
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms t ON t.id = u.term_id
    WHERE s.id = ${submissionId}
  `) as unknown as { class_name: string }[];
  return rows[0]?.class_name ?? null;
}

export interface LessonWorksheetSubmission {
  id: number;
  lesson_id: number;
  child_id: number;
  /** Null when the student submitted a voice-only answer instead of uploading a worksheet file --
   * see submitLessonWorksheetSchema, which requires at least one of the two. */
  file_url: string | null;
  answer_audio_url: string | null;
  submitted_at: string;
  grade: string | null;
  comments: string | null;
  graded_at: string | null;
}

export async function submitLessonWorksheet(
  lessonId: number,
  childId: number,
  submission: { fileUrl: string | null; answerAudioUrl: string | null }
): Promise<void> {
  await sql`
    INSERT INTO curriculum_lesson_worksheet_submissions (lesson_id, child_id, file_url, answer_audio_url)
    VALUES (${lessonId}, ${childId}, ${submission.fileUrl}, ${submission.answerAudioUrl})
    ON CONFLICT (lesson_id, child_id) DO UPDATE SET
      file_url = EXCLUDED.file_url,
      answer_audio_url = EXCLUDED.answer_audio_url,
      submitted_at = now(),
      grade = NULL,
      comments = NULL,
      graded_by = NULL,
      graded_at = NULL
  `;
}

export async function getLessonWorksheetSubmission(lessonId: number, childId: number): Promise<LessonWorksheetSubmission | null> {
  const rows = (await sql`
    SELECT id, lesson_id, child_id, file_url, answer_audio_url, submitted_at::text, grade, comments, graded_at::text
    FROM curriculum_lesson_worksheet_submissions WHERE lesson_id = ${lessonId} AND child_id = ${childId}
  `) as unknown as LessonWorksheetSubmission[];
  return rows[0] ?? null;
}

export interface WorksheetForReview extends LessonWorksheetSubmission {
  lesson_title: string;
  child_full_name: string;
  class_name: string;
  subject: string;
}

export async function getLessonWorksheetsForReview(): Promise<WorksheetForReview[]> {
  return (await sql`
    SELECT s.id, s.lesson_id, s.child_id, s.file_url, s.answer_audio_url, s.submitted_at::text, s.grade, s.comments, s.graded_at::text,
      l.title AS lesson_title, c.child_full_name, t.class_name, t.subject
    FROM curriculum_lesson_worksheet_submissions s
    JOIN curriculum_unit_lessons l ON l.id = s.lesson_id
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms t ON t.id = u.term_id
    JOIN children c ON c.id = s.child_id
    ORDER BY s.submitted_at DESC
  `) as unknown as WorksheetForReview[];
}

export async function gradeLessonWorksheet(submissionId: number, grade: string | null, comments: string | null, gradedBy: number): Promise<void> {
  await sql`
    UPDATE curriculum_lesson_worksheet_submissions
    SET grade = ${grade}, comments = ${comments}, graded_by = ${gradedBy}, graded_at = now()
    WHERE id = ${submissionId}
  `;
}

export interface OnlineLearningOverviewRow {
  class_name: string;
  subject: string;
  lessons_published: number;
  lessons_completed_by_at_least_one: number;
  answers_awaiting_review: number;
  worksheets_awaiting_review: number;
}

/** The admin Online Learning landing page's summary table -- one row per class/subject with a
 * published curriculum, so a teacher can see at a glance where self-directed progress and marking
 * queues stand without opening every lesson. */
export async function getOnlineLearningOverview(): Promise<OnlineLearningOverviewRow[]> {
  return (await sql`
    SELECT t.class_name, t.subject,
      count(DISTINCT l.id)::int AS lessons_published,
      count(DISTINCT p.lesson_id)::int AS lessons_completed_by_at_least_one,
      count(DISTINCT CASE WHEN ans.graded_at IS NULL THEN ans.id END)::int AS answers_awaiting_review,
      count(DISTINCT CASE WHEN ws.graded_at IS NULL THEN ws.id END)::int AS worksheets_awaiting_review
    FROM curriculum_terms t
    JOIN curriculum_term_units u ON u.term_id = t.id
    JOIN curriculum_unit_lessons l ON l.unit_id = u.id AND l.review_status = 'published'
    LEFT JOIN child_lesson_online_progress p ON p.lesson_id = l.id AND p.completed_at IS NOT NULL
    LEFT JOIN curriculum_lesson_quiz_questions q ON q.lesson_id = l.id
    LEFT JOIN curriculum_lesson_answer_submissions ans ON ans.quiz_question_id = q.id
    LEFT JOIN curriculum_lesson_worksheet_submissions ws ON ws.lesson_id = l.id
    GROUP BY t.class_name, t.subject
    ORDER BY t.class_name, t.subject
  `) as unknown as OnlineLearningOverviewRow[];
}

// --- Per-student online learning: enable a specific child for self-directed online learning
// (children.online_learning_enabled), give them their own programme (curriculum_terms they've
// been assigned individually, independent of class_name) and a weekly timetable of recurring
// slots -- each slot resolves dynamically to "whichever lesson in that term the child hasn't
// completed yet," never a fixed lessonId a teacher would have to keep updating by hand. ---

/** For the canAccessClass gate on the admin per-student online-learning routes below. */
export async function getChildForOnlineLearningAccessCheck(childId: number): Promise<{ class_name: string | null; child_full_name: string } | null> {
  const rows = (await sql`SELECT class_name, child_full_name FROM children WHERE id = ${childId}`) as unknown as {
    class_name: string | null;
    child_full_name: string;
  }[];
  return rows[0] ?? null;
}

export interface OnlineLearningStudentRow {
  child_id: number;
  child_full_name: string;
  class_name: string | null;
  programme_term_count: number;
  schedule_slot_count: number;
}

/** Every online-learning-enabled child, for the admin "Online Students" list -- callers filter by
 * canAccessClass themselves (same pattern as getAnswersForReview/getLessonWorksheetsForReview's
 * callers), since class_name can be null here and canAccessClass is a page-level concern. */
export async function getOnlineLearningStudents(): Promise<OnlineLearningStudentRow[]> {
  return (await sql`
    SELECT c.id AS child_id, c.child_full_name, c.class_name,
      count(DISTINCT pt.id)::int AS programme_term_count,
      count(DISTINCT sl.id)::int AS schedule_slot_count
    FROM children c
    LEFT JOIN child_online_programme_terms pt ON pt.child_id = c.id
    LEFT JOIN child_online_schedule_slots sl ON sl.child_id = c.id
    WHERE c.online_learning_enabled = true
    GROUP BY c.id, c.child_full_name, c.class_name
    ORDER BY c.child_full_name
  `) as unknown as OnlineLearningStudentRow[];
}

/** Same select list as getCurriculumTermsForClass/getAllCurriculumTerms in curriculum.ts -- kept
 * here rather than there since this join is specific to the per-child assignment table this file
 * owns. */
export async function getChildOnlineProgrammeTerms(childId: number): Promise<CurriculumTerm[]> {
  return (await sql`
    SELECT t.id, t.class_name, t.subject, t.term_label, t.framework_label, t.exam_board, t.exam_series,
      t.syllabus_pdf_url, t.workbook_pdf_url, t.source_verified, t.source_note
    FROM child_online_programme_terms pt
    JOIN curriculum_terms t ON t.id = pt.curriculum_term_id
    WHERE pt.child_id = ${childId}
    ORDER BY t.subject, t.term_label
  `) as unknown as CurriculumTerm[];
}

export async function assignChildOnlineTerm(childId: number, termId: number): Promise<void> {
  await sql`
    INSERT INTO child_online_programme_terms (child_id, curriculum_term_id)
    VALUES (${childId}, ${termId})
    ON CONFLICT (child_id, curriculum_term_id) DO NOTHING
  `;
}

/** Also removes any weekly schedule slots pointing at this term for this child -- a slot for a
 * programme that's no longer assigned would otherwise keep resolving to a lesson the student was
 * never (or no longer) actually given (curriculum_term_id is a direct FK to curriculum_terms, not
 * routed through this assignment table, so it wouldn't be cleaned up on its own). */
export async function removeChildOnlineTerm(childId: number, termId: number): Promise<void> {
  await sql`DELETE FROM child_online_schedule_slots WHERE child_id = ${childId} AND curriculum_term_id = ${termId}`;
  await sql`DELETE FROM child_online_programme_terms WHERE child_id = ${childId} AND curriculum_term_id = ${termId}`;
}

export interface ChildOnlineScheduleSlot {
  id: number;
  child_id: number;
  curriculum_term_id: number;
  subject: string;
  term_label: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  label: string | null;
}

export async function getChildOnlineScheduleSlots(childId: number): Promise<ChildOnlineScheduleSlot[]> {
  return (await sql`
    SELECT s.id, s.child_id, s.curriculum_term_id, t.subject, t.term_label,
      s.day_of_week, s.start_time::text, s.end_time::text, s.label
    FROM child_online_schedule_slots s
    JOIN curriculum_terms t ON t.id = s.curriculum_term_id
    WHERE s.child_id = ${childId}
    ORDER BY
      CASE s.day_of_week
        WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6 ELSE 7
      END,
      s.start_time
  `) as unknown as ChildOnlineScheduleSlot[];
}

export async function addChildOnlineScheduleSlot(
  childId: number,
  slot: { curriculumTermId: number; dayOfWeek: string; startTime: string; endTime: string; label: string | null }
): Promise<number> {
  const rows = (await sql`
    INSERT INTO child_online_schedule_slots (child_id, curriculum_term_id, day_of_week, start_time, end_time, label)
    VALUES (${childId}, ${slot.curriculumTermId}, ${slot.dayOfWeek}, ${slot.startTime}, ${slot.endTime}, ${slot.label})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function deleteChildOnlineScheduleSlot(slotId: number): Promise<void> {
  await sql`DELETE FROM child_online_schedule_slots WHERE id = ${slotId}`;
}

/** For the canAccessClass gate on the admin schedule-management routes. */
export async function getChildIdForOnlineScheduleSlot(slotId: number): Promise<number | null> {
  const rows = (await sql`SELECT child_id FROM child_online_schedule_slots WHERE id = ${slotId}`) as unknown as { child_id: number }[];
  return rows[0]?.child_id ?? null;
}

export interface NextLessonResolution {
  lessonId: number;
  lessonTitle: string;
  unitTitle: string;
  /** True once every lesson in the term is marked completed -- lessonId/lessonTitle still point at
   * the last lesson in that case, so a "revisit" link always has somewhere sensible to go. */
  allCompleted: boolean;
}

function resolveNextLesson(term: CurriculumTermTree, progress: Map<number, LessonProgressStatus>): NextLessonResolution | null {
  const lessons = flattenLessons(term);
  if (lessons.length === 0) return null;
  const next = lessons.find((l) => (progress.get(l.id) ?? 'not_started') !== 'completed') ?? lessons[lessons.length - 1];
  const unit = term.units.find((u) => u.id === next.unit_id);
  return {
    lessonId: next.id,
    lessonTitle: next.title,
    unitTitle: unit?.title ?? '',
    allCompleted: lessons.every((l) => (progress.get(l.id) ?? 'not_started') === 'completed'),
  };
}

/** "Whichever lesson in this term the child hasn't completed yet" -- what an online schedule slot
 * resolves to when clicked, so a teacher never has to hand-update a fixed lessonId as the child
 * progresses. Returns null only if the term has no published lessons at all. */
export async function getNextLessonForChildTerm(childId: number, termId: number): Promise<NextLessonResolution | null> {
  const term = await getCurriculumTermTree(termId);
  if (!term) return null;
  const progress = await getProgressMapForChild(childId);
  return resolveNextLesson(term, progress);
}

export interface ChildOnlineScheduleSlotWithLesson extends ChildOnlineScheduleSlot {
  nextLesson: NextLessonResolution | null;
}

/** Batches getNextLessonForChildTerm across every one of a child's slots -- one progress-map fetch
 * and one term-tree fetch per distinct term (not per slot), for the schedule board both the
 * student and parent portals render. */
export async function getChildOnlineScheduleWithNextLessons(childId: number): Promise<ChildOnlineScheduleSlotWithLesson[]> {
  const slots = await getChildOnlineScheduleSlots(childId);
  if (slots.length === 0) return [];
  const termIds = [...new Set(slots.map((s) => s.curriculum_term_id))];
  const [progress, trees] = await Promise.all([getProgressMapForChild(childId), Promise.all(termIds.map((id) => getCurriculumTermTree(id)))]);
  const treeByTermId = new Map(termIds.map((id, i) => [id, trees[i]]));
  return slots.map((s) => {
    const term = treeByTermId.get(s.curriculum_term_id);
    return { ...s, nextLesson: term ? resolveNextLesson(term, progress) : null };
  });
}
