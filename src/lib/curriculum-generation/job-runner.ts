import { sql } from '@/lib/db';
import { computeLessonPacing, type LessonPacing } from './pacing';
import { extractPdfTextFromUrl } from './pdf-extract';
import { AnthropicContentGenerationProvider } from './anthropic-provider';
import { insertGeneratedUnit, flattenTopics, loadExampleContext, persistSyllabusTopics } from './generate';
import type { ParsedSyllabus, WorkbookMasterySignal } from './types';

export type GenerationJobStatus = 'pending' | 'parsing' | 'generating' | 'completed' | 'failed';

export interface GenerationJobProgressEntry {
  at: string;
  message: string;
}

export interface GenerationJobRow {
  id: number;
  class_name: string;
  subject: string;
  term_label: string;
  exam_board: string;
  exam_series: string;
  framework_label: string | null;
  syllabus_pdf_url: string;
  workbook_pdf_url: string | null;
  status: GenerationJobStatus;
  term_id: number | null;
  parsed_syllabus: ParsedSyllabus | null;
  pacing: LessonPacing | null;
  workbook_mastery_signals: WorkbookMasterySignal[] | null;
  current_topic_index: number;
  lesson_count_per_unit: number | null;
  total_units: number | null;
  completed_units: number;
  completed_lessons: number;
  progress_log: GenerationJobProgressEntry[];
  error: string | null;
  requested_by_admin_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGenerationJobData {
  className: string;
  subject: string;
  termLabel: string;
  examBoard: string;
  examSeries: string;
  frameworkLabel: string | null;
  syllabusPdfUrl: string;
  workbookPdfUrl: string | null;
  requestedByAdminUserId: number;
}

export async function createGenerationJob(input: CreateGenerationJobData): Promise<GenerationJobRow> {
  const [row] = (await sql`
    INSERT INTO curriculum_generation_jobs
      (class_name, subject, term_label, exam_board, exam_series, framework_label,
       syllabus_pdf_url, workbook_pdf_url, requested_by_admin_user_id)
    VALUES (
      ${input.className}, ${input.subject}, ${input.termLabel}, ${input.examBoard}, ${input.examSeries},
      ${input.frameworkLabel}, ${input.syllabusPdfUrl}, ${input.workbookPdfUrl}, ${input.requestedByAdminUserId}
    )
    RETURNING
      id, class_name, subject, term_label, exam_board, exam_series, framework_label,
      syllabus_pdf_url, workbook_pdf_url, status, term_id, parsed_syllabus, pacing,
      workbook_mastery_signals, current_topic_index, lesson_count_per_unit, total_units,
      completed_units, completed_lessons, progress_log, error, requested_by_admin_user_id,
      created_at::text, updated_at::text
  `) as unknown as GenerationJobRow[];
  return row;
}

export async function getGenerationJob(id: number): Promise<GenerationJobRow | null> {
  const rows = (await sql`
    SELECT
      id, class_name, subject, term_label, exam_board, exam_series, framework_label,
      syllabus_pdf_url, workbook_pdf_url, status, term_id, parsed_syllabus, pacing,
      workbook_mastery_signals, current_topic_index, lesson_count_per_unit, total_units,
      completed_units, completed_lessons, progress_log, error, requested_by_admin_user_id,
      created_at::text, updated_at::text
    FROM curriculum_generation_jobs WHERE id = ${id}
  `) as unknown as GenerationJobRow[];
  return rows[0] ?? null;
}

async function appendProgress(jobId: number, message: string): Promise<void> {
  const entry: GenerationJobProgressEntry = { at: new Date().toISOString(), message };
  await sql`
    UPDATE curriculum_generation_jobs SET progress_log = progress_log || ${JSON.stringify([entry])}::jsonb, updated_at = now()
    WHERE id = ${jobId}
  `;
}

/** The 'pending' -> 'generating' transition: extracts text from the uploaded syllabus (and
 * optional workbook) PDF, parses the syllabus, computes real pacing against the class's timetable
 * + academic calendar, creates the curriculum_terms row, and persists the syllabus topic tree --
 * everything generateCurriculumTerm's own opening steps do (see generate.ts's own comment),
 * just split into its own resumable step so a single request never has to do the syllabus parse
 * *and* every unit's generation in one shot. */
async function runInitStep(job: GenerationJobRow): Promise<GenerationJobRow> {
  await sql`UPDATE curriculum_generation_jobs SET status = 'parsing', updated_at = now() WHERE id = ${job.id}`;

  const [existingTerm] = (await sql`
    SELECT id FROM curriculum_terms WHERE class_name = ${job.class_name} AND subject = ${job.subject} AND term_label = ${job.term_label}
  `) as unknown as { id: number }[];
  if (existingTerm) {
    throw new Error(
      `A programme already exists for ${job.class_name} / ${job.subject} / "${job.term_label}" (id ${existingTerm.id}). ` +
        'Use a different term label to generate a new one.'
    );
  }

  const syllabusText = await extractPdfTextFromUrl(job.syllabus_pdf_url);
  const workbookText = job.workbook_pdf_url ? await extractPdfTextFromUrl(job.workbook_pdf_url) : undefined;

  const provider = new AnthropicContentGenerationProvider();
  const parsedSyllabus = await provider.parseSyllabus({ syllabusText, subject: job.subject });
  const pacing = await computeLessonPacing(job.class_name, job.subject, job.term_label);
  const topLevelTopics = parsedSyllabus.topicTree;
  const lessonCountPerUnit = Math.max(1, Math.round(pacing.sessionCount / Math.max(topLevelTopics.length, 1)));

  const workbookMasterySignals = workbookText
    ? (await provider.analyzeWorkbook({ workbookText, topicTree: flattenTopics(topLevelTopics) })).masterySignals
    : [];

  const [term] = (await sql`
    INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label, exam_board, exam_series, syllabus_pdf_url, workbook_pdf_url)
    VALUES (
      ${job.class_name}, ${job.subject}, ${job.term_label}, ${job.framework_label ?? parsedSyllabus.frameworkLabel ?? null},
      ${job.exam_board}, ${job.exam_series}, ${job.syllabus_pdf_url}, ${job.workbook_pdf_url}
    )
    RETURNING id
  `) as unknown as { id: number }[];

  await persistSyllabusTopics(term.id, topLevelTopics);

  const entry: GenerationJobProgressEntry = {
    at: new Date().toISOString(),
    message: `Parsed syllabus: ${topLevelTopics.length} topic(s) found. Pacing: ${pacing.sessionCount} session(s) planned (${pacing.source === 'class_schedule' ? `from the timetable, ${pacing.academicTermLabel}` : 'default -- no matching timetable/academic term found yet'}).`,
  };
  await sql`
    UPDATE curriculum_generation_jobs SET
      status = 'generating',
      term_id = ${term.id},
      parsed_syllabus = ${JSON.stringify(parsedSyllabus)}::jsonb,
      pacing = ${JSON.stringify(pacing)}::jsonb,
      workbook_mastery_signals = ${JSON.stringify(workbookMasterySignals)}::jsonb,
      current_topic_index = 0,
      lesson_count_per_unit = ${lessonCountPerUnit},
      total_units = ${topLevelTopics.length},
      progress_log = progress_log || ${JSON.stringify([entry])}::jsonb,
      updated_at = now()
    WHERE id = ${job.id}
  `;

  return (await getGenerationJob(job.id))!;
}

/** Generates and inserts exactly one unit (one top-level syllabus topic) per call -- the resumable
 * body of the job. A page reload mid-run just re-polls the same job row and the next step call
 * picks up at current_topic_index, so nothing here depends on any in-memory state surviving
 * between calls. */
async function runUnitStep(job: GenerationJobRow): Promise<GenerationJobRow> {
  const parsedSyllabus = job.parsed_syllabus;
  if (!parsedSyllabus || job.term_id == null) {
    throw new Error('Generation job is missing its parsed syllabus or term -- this should not happen once status is "generating".');
  }
  const topics = parsedSyllabus.topicTree;
  const idx = job.current_topic_index;

  if (idx >= topics.length) {
    await sql`UPDATE curriculum_generation_jobs SET status = 'completed', updated_at = now() WHERE id = ${job.id}`;
    return (await getGenerationJob(job.id))!;
  }

  const topic = topics[idx];
  await appendProgress(job.id, `Generating "${topic.title}"…`);

  const exampleContext = await loadExampleContext(job.requested_by_admin_user_id ?? undefined);
  const provider = new AnthropicContentGenerationProvider();
  const unit = await provider.generateUnit({
    topic,
    subject: job.subject,
    className: job.class_name,
    lessonCount: job.lesson_count_per_unit ?? 1,
    exampleContext,
    assessmentObjectives: parsedSyllabus.assessmentObjectives,
  });

  const counts = await insertGeneratedUnit(job.term_id, job.completed_units, unit);

  const nextIndex = idx + 1;
  const nowComplete = nextIndex >= topics.length;
  const warningNote = counts.calculationWarnings.length > 0 ? ` (${counts.calculationWarnings.length} calculation warning(s) to review)` : '';
  const entry: GenerationJobProgressEntry = {
    at: new Date().toISOString(),
    message: `Generated "${unit.title}": ${counts.lessonsCreated} lesson(s)${warningNote}.`,
  };

  await sql`
    UPDATE curriculum_generation_jobs SET
      status = ${nowComplete ? 'completed' : 'generating'},
      current_topic_index = ${nextIndex},
      completed_units = completed_units + 1,
      completed_lessons = completed_lessons + ${counts.lessonsCreated},
      progress_log = progress_log || ${JSON.stringify([entry])}::jsonb,
      updated_at = now()
    WHERE id = ${job.id}
  `;

  return (await getGenerationJob(job.id))!;
}

/** Advances a generation job by exactly one unit of work and returns its updated state -- the one
 * function the /step API route calls, driven by the Course Builder page's own client-side polling
 * loop (see that page's own comment on why a client-driven loop was chosen over a faster cron: no
 * Vercel cron-frequency plan question to resolve, and it naturally reports progress after every
 * single call). A job already 'completed' or 'failed' is a safe no-op -- calling step again just
 * returns its final state, so a client that fires one call too many (a race on the last poll)
 * never causes a second run. */
export async function stepGenerationJob(jobId: number): Promise<GenerationJobRow> {
  const job = await getGenerationJob(jobId);
  if (!job) {
    throw new Error('Generation job not found.');
  }
  if (job.status === 'completed' || job.status === 'failed') {
    return job;
  }

  try {
    if (job.status === 'pending') {
      return await runInitStep(job);
    }
    return await runUnitStep(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sql`UPDATE curriculum_generation_jobs SET status = 'failed', error = ${message}, updated_at = now() WHERE id = ${jobId}`;
    return (await getGenerationJob(jobId))!;
  }
}
