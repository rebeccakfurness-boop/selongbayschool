/** Shape of curriculum_unit_lessons.interactive_content -- the step-by-step experience
 * InteractiveLessonStepper (src/components/curriculum/interactive/InteractiveLessonStepper.tsx)
 * renders in place of the plain objectives/worksheet/video view. One lesson has one ordered
 * `steps` array; every component in src/components/curriculum/interactive renders exactly one
 * step type here.
 *
 * This is a React/Postgres port of the widget set proven in
 * rebeccakfurness-boop/selongbayschool-teaching's Tom's-Economics prototype
 * (courses/tom-economics/assets/lesson-kit.js + .css, courses/tom-economics/lessons/lesson-06 as
 * the worked example) -- ported for functional equivalence, not literal code: each JS
 * `LessonKit.buildX` function there becomes one step type + one React component here, restyled
 * to this app's own design tokens rather than Tom's CSS. Two things map 1:1 from that prototype
 * on purpose:
 *  - every step there carries a kicker + title + optional lede rendered above the widget itself
 *    (see BaseStep below) -- InteractiveLessonStepper renders this once, per step, rather than
 *    each widget re-implementing its own heading.
 *  - `buildFlipGrid` and `buildRevealCards` there each render a *grid* of several cards in one
 *    step (e.g. 4 recap flashcards together), not one card per step -- FlipCardStep and
 *    GuessRevealStep below are arrays for the same reason.
 *
 * Every step's `conceptId`/`testsConceptIds` pair exists purely for the generation engine's own
 * ordering check (an explanation must be authored before any step that tests its concept) -- the
 * stepper itself just renders steps in the order given, it doesn't enforce this at runtime. See
 * validateStepOrdering in src/lib/curriculum-generation/validate.ts -- this is the code-level
 * proof of the same "explanation before test" and "no answer before question" invariants Tom's
 * prototype only enforced by hand-authoring discipline.
 *
 * The 'quiz' step type is a *reference* into the lesson's own starter_quiz/exit_quiz, not a copy
 * of the questions -- curriculum_lesson_quiz_questions stays the single source of truth for the
 * graded, one-at-a-time starter/exit quiz content, and the stepper resolves this step by looking
 * up lesson.starter_quiz/exit_quiz and handing them to the same QuizStep component the "Complete
 * online" flow already uses. 'inline_quiz' is the separate, ungraded port of Tom's own
 * `buildQuiz` -- several short questions shown together on one step with instant per-question
 * feedback and no navigation of their own (e.g. lesson-06's "Before Homework..." check) -- kept
 * distinct from 'quiz' rather than merged into it, since they're genuinely different widgets for
 * different moments (a quick recap check vs. the formal graded quiz). */
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
  | InlineQuizStep
  | RecapChecklistStep;

interface BaseStep {
  /** Stable within one lesson's interactive_content -- used as the React key, the keyboard-nav
   * position, and (for explanation/tests-concept pairs) the ordering check's join key. */
  id: string;
  /** Short eyebrow label above the step's title, e.g. "New idea" or "Now you try" -- matches
   * every <span class="kicker"> in Tom's prototype's lesson.html. Rendered once by
   * InteractiveLessonStepper's shared step header, not by the individual widget. */
  kicker?: string;
  title?: string;
  /** Intro paragraph below the title, before the widget itself (Tom's <p class="lede">). */
  lede?: string;
}

/** Must appear before any later step whose testsConceptIds includes this step's conceptId --
 * enforced by the generation engine, not the renderer. Tom's prototype has no single named
 * builder for this (its "New idea" steps are hand-written <div class="card"> HTML per lesson) --
 * this is a data-driven generalisation of that same pattern rather than a ported function. */
export interface ExplanationStep extends BaseStep {
  type: 'explanation';
  conceptId?: string;
  definition: string;
  example: string;
}

export interface FlipCard {
  term: string;
  /** Shown on the front under the term, e.g. "Tap to reveal ↻" -- optional, defaults in the
   * component. */
  hint?: string;
  definition: string;
}

/** A grid of several term/definition flip cards shown together -- matches buildFlipGrid, which
 * always renders a data array (Tom's lesson-06 opens with 4 recap cards in one step), not a
 * single card. */
export interface FlipCardStep extends BaseStep {
  type: 'flip_card';
  cards: FlipCard[];
  testsConceptIds?: string[];
}

export interface RevealCardTag {
  label: string;
  tone: 'up' | 'down' | 'neutral';
}

export interface GuessRevealCardData {
  question: string;
  answer: string;
  tags?: RevealCardTag[];
}

/** A set of guess-then-reveal cards shown together -- matches buildRevealCards, which (like
 * buildFlipGrid) always takes a data array rendered as a group, e.g. lesson-06's two
 * "Which advantage is this?" cards on one step. Each card never shows its answer until tapped --
 * see GuessRevealCard.tsx's own comment for how that invariant is kept at render time, not just
 * by the generation engine. */
export interface GuessRevealStep extends BaseStep {
  type: 'guess_reveal';
  cards: GuessRevealCardData[];
  testsConceptIds?: string[];
}

export interface SortClassifyItem {
  id: string;
  label: string;
  correctCategory: string;
  /** Shown once the item's been answered, correct or not -- matches buildSortActivity's
   * always-shown .sort-reason, not just an error message on a wrong guess. */
  reason: string;
}

export interface SortClassifyStep extends BaseStep {
  type: 'sort_classify';
  categories: string[];
  items: SortClassifyItem[];
  testsConceptIds?: string[];
}

export interface TapRevealCard {
  id: string;
  /** A single emoji, matching buildShiftGrid's `emj` field (e.g. "🔐"). */
  icon?: string;
  label: string;
  content: string;
}

/** Matches buildShiftGrid (Tom's "clickable reveal grid" for determinants/shifters/characteristics
 * -- lesson-06's 5-card "Characteristics of a Market Economy" grid). */
export interface TapRevealGridStep extends BaseStep {
  type: 'tap_reveal_grid';
  cards: TapRevealCard[];
}

/** One row of a worked-example walkthrough -- `detail` is typically the actual working (a
 * calculation line), shown in monospace to match buildStepsList's .step-detail styling. */
export interface WorkedExampleRow {
  label: string;
  detail: string;
}

export interface WorkedExampleStep extends BaseStep {
  type: 'worked_example';
  /** Rendered as a numbered list; the last entry is auto-highlighted as the final answer. */
  steps: WorkedExampleRow[];
  testsConceptIds?: string[];
}

export interface CalculatorReadout {
  label: string;
  value: string;
}

/** One scenario button's data -- matches buildReader's per-item readouts. Values are
 * pre-computed at authoring/generation time rather than a stored formula: interactive_content is
 * generated JSON, so evaluating an arbitrary expression from it would mean running generated
 * "code"; a closed set of scenario buttons swapping between already-computed readouts gets the
 * same interactive feel without that risk. */
export interface CalculatorScenario {
  id: string;
  label: string;
  readouts: CalculatorReadout[];
}

export interface InteractiveCalculatorStep extends BaseStep {
  type: 'interactive_calculator';
  scenarios: CalculatorScenario[];
}

export interface DataTableStep extends BaseStep {
  type: 'data_table';
  columns: string[];
  rows: (string | number)[][];
  /** Highlights one row, matching buildDataTable's bestIndex (e.g. the profit-maximising output
   * row). Omit for a plain table. */
  highlightRowIndex?: number;
}

/** This app's own tone tokens rather than Tom's raw hex bar colours (--teal/--coral/--gold) --
 * ProportionalBarCompare.tsx maps each to one of this app's actual design-system colors (see
 * tailwind.config.ts) so bars stay on-brand across every subject rather than carrying Tom's
 * Economics palette forward. */
export type BarTone = 'teal' | 'orange' | 'lightteal';

export interface ProportionalBarCompareStep extends BaseStep {
  type: 'proportional_bar_compare';
  unit?: string;
  items: { label: string; value: number; tone?: BarTone }[];
}

export interface QuizRefStep extends BaseStep {
  type: 'quiz';
  /** Which of the lesson's own quiz question sets this step renders -- see this type's own file
   * comment on why this is a reference rather than a copy. */
  quizType: 'starter' | 'exit';
}

export interface InlineQuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  /** Shown after answering, prefixed with ✓/✗ by the component -- matches buildQuiz's `fb`. */
  feedback: string;
}

/** Several short questions shown together with instant per-question feedback, no scoring, no
 * navigation of their own -- matches buildQuiz exactly (Tom's lesson-06 "Before Homework..."
 * step). Distinct from QuizRefStep -- see this file's top comment for why. */
export interface InlineQuizStep extends BaseStep {
  type: 'inline_quiz';
  questions: InlineQuizQuestion[];
  testsConceptIds?: string[];
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
