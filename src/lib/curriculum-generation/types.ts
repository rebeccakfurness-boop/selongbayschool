import type { InteractiveLessonContent, TeachingScript } from '@/lib/interactive-content-types';
import type { CalculationCheck } from './calculation-check';

export interface SyllabusTopicNode {
  /** Stable within one parse -- joins a topic back to its generated unit/lessons, and lets a
   * workbook-mastery signal point at the topic it's about. */
  id: string;
  title: string;
  description?: string;
  assessmentObjectives?: string[];
  subtopics?: SyllabusTopicNode[];
}

export interface SyllabusComponent {
  /** e.g. "Paper 1: Multiple Choice" for a syllabus with distinct exam papers/components. */
  name: string;
  description?: string;
  weightingPercent?: number;
}

export interface ParsedSyllabus {
  subject: string;
  frameworkLabel?: string;
  topicTree: SyllabusTopicNode[];
  assessmentObjectives: string[];
  components: SyllabusComponent[];
}

export interface WorkbookMasterySignal {
  topicId: string;
  topicTitle: string;
  /** Why the provider thinks this topic is already mastered -- shown verbatim to the teacher
   * confirming which topics to actually skip (see generate.ts's own comment: this is always
   * proposed, never applied automatically). */
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface WorkbookAnalysis {
  masterySignals: WorkbookMasterySignal[];
}

export interface GeneratedQuizQuestion {
  quizType: 'starter' | 'exit';
  question: string;
  options: string[];
  correctOptionIndex: number;
  hint?: string;
}

export interface GeneratedFlashcard {
  term: string;
  definition: string;
}

/** Mirrors curriculum_unit_lessons.phase's CHECK constraint in db.ts -- kept as a plain string
 * union here rather than importing it from lib/curriculum.ts, matching this module's existing
 * one-directional dependency (curriculum-generation depends on nothing curriculum-authoring-side). */
export type LessonPhase = 'content' | 'review' | 'revision' | 'exam_skill' | 'past_paper' | 'buffer';

export interface GeneratedLesson {
  title: string;
  objectives: string;
  interactiveContent: InteractiveLessonContent;
  teachingScript: TeachingScript;
  quizQuestions: GeneratedQuizQuestion[];
  flashcards: GeneratedFlashcard[];
  /** Only populated by a provider for calculation-heavy subjects -- see checkCalculations in
   * ./calculation-check, which generate.ts runs against these before publishing anything. */
  calculationChecks?: CalculationCheck[];
  /** Defaults to 'content' in generate.ts if omitted -- most generated lessons are new content,
   * so a provider only needs to set this for review/revision/exam-skill/past-paper/buffer slots. */
  phase?: LessonPhase;
  /** Free text, e.g. "2.4.3 / 2.5" -- can name more than one syllabus point. Feeds the planning
   * dashboard's Syllabus Map view (see curriculum_unit_lessons.syllabus_ref in db.ts). */
  syllabusRef?: string;
  /** When present, generate.ts renders this into a real .docx (primary, mandatory format) and PDF
   * (secondary) via ./worksheet-files and uploads both to Vercel Blob -- see WorksheetContent's
   * own comment. Omitted entirely for a lesson with no worksheet (e.g. a pure discussion/review
   * slot), same as every other optional GeneratedLesson field. */
  worksheetContent?: WorksheetContent;
}

export interface WorksheetQuestion {
  prompt: string;
  /** Shown next to the question on the printed worksheet, e.g. "(3 marks)" -- omitted when not
   * meaningful (a short-answer or discussion-style prompt). */
  marks?: number;
  /** Never shown next to the question itself -- rendered under a separate "Answer key" heading
   * (after a page break) at the end of both the docx and PDF, matching how this app already
   * surfaces correct answers transparently elsewhere (see the online quiz flow). Omitted for a
   * question with no single correct answer to check against. */
  answer?: string;
}

/** The structured source both worksheet files (docx primary, PDF secondary) are rendered from --
 * see buildWorksheetDocx/buildWorksheetPdf in ./worksheet-files. Kept as data rather than
 * pre-rendered markup so a future regeneration (a different template, a fixed typo) doesn't
 * require re-running the whole generation pipeline. */
export interface WorksheetContent {
  title: string;
  instructions?: string;
  questions: WorksheetQuestion[];
}

export interface GeneratedUnit {
  topicId: string;
  title: string;
  description?: string;
  lessons: GeneratedLesson[];
}

export interface ExampleContext {
  interests: string[];
  localReferences: string[];
}

/** The one seam this whole pipeline calls out to an actual LLM through. No provider is wired in
 * yet (this app has no LLM SDK dependency and no API key configured) -- see
 * NotConfiguredProvider in ./provider for what happens if this is called before one is. Every
 * other part of the pipeline below (upserting rows, respecting the UNIQUE constraint, pacing,
 * calculation verification, the needs_review gate) is real and runs today; only this interface's
 * three methods need a real implementation plugged in before generate() can actually produce
 * content. */
export interface ContentGenerationProvider {
  parseSyllabus(input: { syllabusText: string; subject: string }): Promise<ParsedSyllabus>;
  analyzeWorkbook(input: { workbookText: string; topicTree: SyllabusTopicNode[] }): Promise<WorkbookAnalysis>;
  generateUnit(input: {
    topic: SyllabusTopicNode;
    subject: string;
    className: string;
    lessonCount: number;
    exampleContext: ExampleContext;
    assessmentObjectives: string[];
  }): Promise<GeneratedUnit>;
}

export interface GenerateCurriculumTermInput {
  className: string;
  subject: string;
  termLabel: string;
  frameworkLabel?: string;
  syllabusText: string;
  workbookText?: string;
  /** Whose context_pack (if any) generateUnit draws examples from -- see ExampleContext. */
  requestedByAdminUserId?: number;
  /** A syllabus for a (className, subject, termLabel) that already has a curriculum_terms row is
   * rejected unless this is explicitly true -- see generate.ts's own comment on why regenerating
   * over existing content needs an explicit go-ahead rather than silently replacing it. */
  allowUpdatingExistingTerm?: boolean;
}

export interface GenerateCurriculumTermResult {
  termId: number;
  unitsCreated: number;
  lessonsCreated: number;
  flashcardsCreated: number;
  quizQuestionsCreated: number;
  pacing: { sessionCount: number; source: 'class_schedule' | 'default'; academicTermLabel: string | null };
  /** Never auto-applied -- see WorkbookMasterySignal's own comment. Empty when no workbookText
   * was given. */
  workbookMasteryProposals: WorkbookMasterySignal[];
  /** Only lessons that actually had a calculationChecks mismatch appear here. */
  calculationWarnings: { lessonTitle: string; warnings: string[] }[];
}
