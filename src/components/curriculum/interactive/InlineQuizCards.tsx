'use client';

import { useState } from 'react';
import type { InlineQuizStep } from '@/lib/interactive-content-types';

function QuestionCard({ question }: { question: InlineQuizStep['questions'][number] }) {
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const isCorrect = answeredIndex !== null && answeredIndex === question.correctOptionIndex;

  function choose(i: number) {
    if (answeredIndex !== null) return;
    setAnsweredIndex(i);
  }

  return (
    <div className="rounded-md border-2 border-sand-line bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-ink">{question.question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {question.options.map((option, i) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(i)}
            disabled={answeredIndex !== null}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition disabled:cursor-default ${
              answeredIndex === i
                ? isCorrect
                  ? 'border-teal bg-teal text-white'
                  : 'border-orange-deep bg-orange/15 text-orange-deep'
                : 'border-sand-line bg-paper text-ink-soft disabled:opacity-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {answeredIndex !== null && (
        <p className={`mt-3 rounded-md px-3 py-2 text-sm ${isCorrect ? 'bg-teal/15 text-teal-deep' : 'bg-orange/15 text-orange-deep'}`}>
          {isCorrect ? '✓ ' : '✗ Not quite — '}
          {question.feedback}
        </p>
      )}
    </div>
  );
}

/** Several short questions shown together with instant per-question feedback and no scoring or
 * navigation of their own -- matches buildQuiz exactly (Tom's "Before Homework..." quick check).
 * Distinct from the graded starter/exit QuizRefStep -- see InlineQuizStep's own comment. */
export default function InlineQuizCards({ step }: { step: InlineQuizStep }) {
  return (
    <div className="flex flex-col gap-3">
      {step.questions.map((question, i) => (
        <QuestionCard key={i} question={question} />
      ))}
    </div>
  );
}
