/** Shape of curriculum_unit_lessons.interactive_content -- the step-by-step experience
 * InteractiveLessonStepper (src/components/curriculum/interactive/InteractiveLessonStepper.tsx)
 * renders in place of the plain objectives/worksheet/video view. One lesson has one ordered
 * `steps` array; every component in src/components/curriculum/interactive renders exactly one
 * step type here.
 *
 * Every step's `conceptId`/`testsConceptIds` pair exists purely for the generation engine's own
 * ordering check (an explanation must be authored before any step that tests its concept) -- the
 * stepper itself just renders steps in the order given, it doesn't enforce this at runtime. See
 * validateStepOrdering in src/lib/curriculum-generation/validate.ts.
 *
 * The 'quiz' step type is a *reference* into the lesson's own starter_quiz/exit_quiz, not a copy
 * of the questions -- curriculum_lesson_quiz_questions stays the single source of truth for quiz
 * content, and the stepper resolves this step by looking up lesson.starter_quiz/exit_quiz and
 * handing them to the same QuizStep component the "Complete online" flow already uses. */
export interface InteractiveLessonContent {
  steps: InteractiveStep[];
}

export type InteractiveStep =
  | ExplanationStep
  | FlipCardStep
  | GuessRevealStep
  | SortClassifyStep
  | TapRevealGridStep
  | WorkedExampleStep
  | InteractiveCalculatorStep
  | DataTableStep
  | ProportionalBarCompareStep
  | QuizRefStep
  | RecapChecklistStep;

interface BaseStep {
  /** Stable within one lesson's interactive_content -- used as the React key, the keyboard-nav
   * position, and (for explanation/tests-concept pairs) the ordering check's join key. */
  id: string;
}

/** Must appear before any later step whose testsConceptIds includes this step's conceptId --
 * enforced by the generation engine, not the renderer. */
export interface ExplanationStep extends BaseStep {
  type: 'explanation';
  conceptId?: string;
  title: string;
  definition: string;
  example: string;
}

/** A single inline "new term" moment (front/back), distinct from the lesson's flashcard deck
 * (curriculum_lesson_flashcards, shown together at the closing recap step) -- this is for
 * introducing one term at the point it's first needed, not the end-of-lesson review set. */
export interface FlipCardStep extends BaseStep {
  type: 'flip_card';
  term: string;
  definition: string;
  testsConceptIds?: string[];
}

export interface GuessRevealStep extends BaseStep {
  type: 'guess_reveal';
  question: string;
  answer: string;
  workedSolution?: string;
  testsConceptIds?: string[];
}

export interface SortClassifyItem {
  id: string;
  label: string;
  correctCategory: string;
}

export interface SortClassifyStep extends BaseStep {
  type: 'sort_classify';
  instructions: string;
  categories: string[];
  items: SortClassifyItem[];
  testsConceptIds?: string[];
}

export interface TapRevealCard {
  id: string;
  label: string;
  content: string;
}

export interface TapRevealGridStep extends BaseStep {
  type: 'tap_reveal_grid';
  title?: string;
  cards: TapRevealCard[];
}

export interface WorkedExampleStep extends BaseStep {
  type: 'worked_example';
  title: string;
  /** Rendered as a numbered list; the last entry is the highlighted final step/answer. */
  steps: string[];
  testsConceptIds?: string[];
}

/** Scenario values are pre-computed at authoring/generation time rather than a stored formula --
 * interactive_content is untrusted-ish generated JSON, so evaluating an arbitrary expression from
 * it would mean running generated "code"; a closed set of scenario buttons swapping between
 * already-computed values gets the same interactive feel without that risk. */
export interface CalculatorScenario {
  id: string;
  label: string;
  inputs: { label: string; value: string }[];
  result: { label: string; value: string };
}

export interface InteractiveCalculatorStep extends BaseStep {
  type: 'interactive_calculator';
  title: string;
  description?: string;
  scenarios: CalculatorScenario[];
}

export interface DataTableStep extends BaseStep {
  type: 'data_table';
  title?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ProportionalBarCompareStep extends BaseStep {
  type: 'proportional_bar_compare';
  title?: string;
  unit?: string;
  items: { label: string; value: number }[];
}

export interface QuizRefStep extends BaseStep {
  type: 'quiz';
  /** Which of the lesson's own quiz question sets this step renders -- see this type's own file
   * comment on why this is a reference rather than a copy. */
  quizType: 'starter' | 'exit';
}

export interface RecapChecklistStep extends BaseStep {
  type: 'recap_checklist';
  summaryPoints: string[];
  homeworkItems: string[];
}

/** curriculum_unit_lessons.teaching_script -- generation-engine output for the teacher running
 * the lesson, never rendered to a student. Keyed by step id so a future teacher-facing view can
 * show the right talking points alongside whichever step the class is on. */
export interface TeachingScript {
  overview: string;
  steps: {
    stepId: string;
    talkingPoints: string[];
    timingMinutes?: number;
    misconceptions?: string[];
  }[];
}

export type VideoSource = 'notebooklm' | 'uploaded' | 'youtube';
