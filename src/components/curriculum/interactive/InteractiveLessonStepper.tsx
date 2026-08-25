'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CurriculumLesson } from '@/lib/curriculum';
import type { InteractiveLessonContent, InteractiveStep } from '@/lib/interactive-content-types';
import QuizStep from '@/components/curriculum/QuizStep';
import ExplanationCard from './ExplanationCard';
import FlipCard from './FlipCard';
import GuessRevealCard from './GuessRevealCard';
import SortClassifyActivity from './SortClassifyActivity';
import TapRevealGrid from './TapRevealGrid';
import WorkedExampleSteps from './WorkedExampleSteps';
import InteractiveCalculator from './InteractiveCalculator';
import DataTable from './DataTable';
import ProportionalBarCompare from './ProportionalBarCompare';
import InlineQuizCards from './InlineQuizCards';
import VocabRecapChecklist from './VocabRecapChecklist';

/** One step visible at a time, progress dots, Back/Next, and left/right arrow keys -- the shared
 * shell every non-quiz step type below renders inside. A 'quiz' step is the one exception: it
 * swaps out this shell entirely for the shared QuizStep component (its own question-by-question
 * chrome, matching how the "Complete online" flow already shows a quiz full-screen rather than
 * nested inside another step frame), resolved against the lesson's own starter_quiz/exit_quiz --
 * see QuizRefStep's own comment on why this is a reference rather than a copy of the questions. */
export default function InteractiveLessonStepper({
  lesson,
  content,
  onExit,
  onComplete,
}: {
  lesson: CurriculumLesson;
  content: InteractiveLessonContent;
  onExit: () => void;
  onComplete: () => void;
}) {
  const steps = content.steps;
  const [index, setIndex] = useState(0);
  const step: InteractiveStep | undefined = steps[index];
  const isLast = index === steps.length - 1;

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        onComplete();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, onComplete]);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goBack();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goBack]);

  if (!step) {
    // An empty steps array shouldn't happen for anything the generation engine actually
    // published, but complete immediately rather than rendering a blank screen.
    onComplete();
    return null;
  }

  if (step.type === 'quiz') {
    const questions = step.quizType === 'starter' ? lesson.starter_quiz : lesson.exit_quiz;
    if (questions.length === 0) {
      // No matching quiz rows to show -- skip straight through instead of rendering an empty quiz.
      goNext();
      return null;
    }
    return (
      <QuizStep
        questions={questions}
        title={step.quizType === 'starter' ? 'Starter Quiz' : 'Exit Quiz'}
        onBack={goBack}
        onFinish={() => (isLast ? onComplete() : goNext())}
      />
    );
  }

  return (
    <div className="min-h-[70vh] rounded-md bg-cream p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={index === 0 ? onExit : goBack}
              aria-label={index === 0 ? 'Exit lesson' : 'Back'}
              className="shrink-0 text-xl text-ink hover:opacity-70"
            >
              ‹
            </button>
            <h1 className="truncate font-display text-lg font-bold text-ink">{lesson.title}</h1>
          </div>
          <span className="shrink-0 font-display text-sm font-bold text-ink-soft">
            {index + 1} of {steps.length}
          </span>
        </div>

        <div className="mt-2 flex gap-1.5">
          {steps.map((s, i) => (
            <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-ink' : i === index ? 'bg-teal' : 'bg-ink/15'}`} />
          ))}
        </div>

        <div className="mt-8" key={step.id}>
          <StepHeader step={step} />
          <StepBody step={step} lesson={lesson} />
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={index === 0 ? onExit : goBack}
            className="rounded-full border-2 border-ink/20 px-6 py-3 text-sm font-bold text-ink hover:bg-ink/5"
          >
            {index === 0 ? 'Exit' : '← Back'}
          </button>
          <button type="button" onClick={goNext} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85">
            {isLast ? 'Finish →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The kicker/title/lede header every step type shares -- ports the header every
 * <section class="step"> carries in Tom's prototype (kicker + h1.title + p.lede above the
 * widget), rendered once here rather than duplicated inside each widget component. All three
 * fields are optional since not every step needs a lede. */
function StepHeader({ step }: { step: Exclude<InteractiveStep, { type: 'quiz' }> }) {
  if (!step.kicker && !step.title && !step.lede) return null;
  return (
    <div className="mb-6">
      {step.kicker && (
        <p className="mb-2 inline-flex items-center rounded-full bg-orange/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-deep">
          {step.kicker}
        </p>
      )}
      {step.title && <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{step.title}</h1>}
      {step.lede && <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-soft">{step.lede}</p>}
    </div>
  );
}

function StepBody({ step, lesson }: { step: Exclude<InteractiveStep, { type: 'quiz' }>; lesson: CurriculumLesson }) {
  switch (step.type) {
    case 'explanation':
      return <ExplanationCard step={step} />;
    case 'flip_card':
      return <FlipCard step={step} />;
    case 'guess_reveal':
      return <GuessRevealCard step={step} />;
    case 'sort_classify':
      return <SortClassifyActivity step={step} />;
    case 'tap_reveal_grid':
      return <TapRevealGrid step={step} />;
    case 'worked_example':
      return <WorkedExampleSteps step={step} />;
    case 'interactive_calculator':
      return <InteractiveCalculator step={step} />;
    case 'data_table':
      return <DataTable step={step} />;
    case 'proportional_bar_compare':
      return <ProportionalBarCompare step={step} />;
    case 'inline_quiz':
      return <InlineQuizCards step={step} />;
    case 'recap_checklist':
      return <VocabRecapChecklist step={step} flashcards={lesson.flashcards} />;
  }
}
