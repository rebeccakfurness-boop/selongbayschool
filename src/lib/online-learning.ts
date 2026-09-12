import { sql } from './db';

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
  quiz_type: 'starter' | 'exit';
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
  file_url: string;
  submitted_at: string;
  grade: string | null;
  comments: string | null;
  graded_at: string | null;
}

export async function submitLessonWorksheet(lessonId: number, childId: number, fileUrl: string): Promise<void> {
  await sql`
    INSERT INTO curriculum_lesson_worksheet_submissions (lesson_id, child_id, file_url)
    VALUES (${lessonId}, ${childId}, ${fileUrl})
    ON CONFLICT (lesson_id, child_id) DO UPDATE SET
      file_url = EXCLUDED.file_url,
      submitted_at = now(),
      grade = NULL,
      comments = NULL,
      graded_by = NULL,
      graded_at = NULL
  `;
}

export async function getLessonWorksheetSubmission(lessonId: number, childId: number): Promise<LessonWorksheetSubmission | null> {
  const rows = (await sql`
    SELECT id, lesson_id, child_id, file_url, submitted_at::text, grade, comments, graded_at::text
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
    SELECT s.id, s.lesson_id, s.child_id, s.file_url, s.submitted_at::text, s.grade, s.comments, s.graded_at::text,
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
