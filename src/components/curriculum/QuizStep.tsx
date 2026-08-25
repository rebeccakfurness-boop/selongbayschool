'use client';

import { useState } from 'react';
import type { CurriculumLesson } from '@/lib/curriculum';

/** The one multiple-choice quiz renderer for curriculum_lesson_quiz_questions, shared by the
 * "Complete online" flow's starter/exit quiz steps (LessonOnlineFlow.tsx) and
 * InteractiveLessonStepper's 'quiz' step type -- extracted here so a second quiz component was
 * never built for the interactive stepper, per the shared-content requirement. */
export default function QuizStep({
  questions,
  title,
  onBack,
  onFinish,
}: {
  questions: CurriculumLesson['starter_quiz'];
  title: string;
  onBack: () => void;
  onFinish: (score: number, total: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = selected === question.correct_option_index;

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
    if (isCorrect) setScore((s) => s + 1);
  }

  function handleNext() {
    if (isLast) {
      onFinish(score, questions.length);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
    setShowHint(false);
  }

  return (
    <div className="min-h-[70vh] rounded-md bg-lime-50 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} aria-label="Back" className="text-xl text-ink hover:opacity-70">‹</button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg">❓</span>
            <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold text-ink">{index + 1} of {questions.length}</span>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          {questions.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-ink' : i === index ? 'bg-teal' : 'bg-ink/15'}`} />
          ))}
        </div>

        <h2 className="mt-8 font-display text-2xl font-bold text-ink">{question.question}</h2>
        <p className="mt-4 inline-block rounded-full bg-lime-200 px-3 py-1 text-xs font-bold text-ink">Select one answer</p>

        <div className="mt-3 flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            let style = 'border-sand-line bg-white';
            if (checked && i === question.correct_option_index) style = 'border-teal bg-teal/15';
            else if (checked && i === selected) style = 'border-orange-deep bg-orange/15';
            return (
              <button
                key={i}
                type="button"
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex items-center gap-3 rounded-md border-2 px-4 py-3 text-left text-sm font-semibold text-ink transition ${style} ${!checked && selected === i ? 'border-ink' : ''}`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${selected === i ? 'border-ink bg-ink' : 'border-ink-soft'}`} />
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {question.hint ? (
            <button type="button" onClick={() => setShowHint((v) => !v)} className="flex items-center gap-2 text-sm font-bold text-ink hover:underline">
              💡 {showHint ? question.hint : 'Need a hint?'}
            </button>
          ) : (
            <span />
          )}
          {!checked ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={selected === null}
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85 disabled:opacity-40"
            >
              Check →
            </button>
          ) : (
            <button type="button" onClick={handleNext} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85">
              {isLast ? 'Finish →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
