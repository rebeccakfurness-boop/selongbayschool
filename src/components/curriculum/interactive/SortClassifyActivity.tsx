'use client';

import { useState } from 'react';
import type { SortClassifyStep } from '@/lib/interactive-content-types';

/** Tap-to-classify rather than drag-and-drop -- no drag-and-drop library is in this project's
 * dependencies, and tapping a category button per item gives the same "instant correct/wrong
 * feedback" the step type asks for with a much simpler, more mobile-friendly interaction (matches
 * QuizStep's own tap-based pattern rather than introducing a new interaction style). */
export default function SortClassifyActivity({ step }: { step: SortClassifyStep }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function choose(itemId: string, category: string) {
    setAnswers((a) => ({ ...a, [itemId]: category }));
  }

  const correctCount = step.items.filter((item) => answers[item.id] === item.correctCategory).length;

  return (
    <div className="rounded-md border-2 border-orange/30 bg-orange/10 p-6">
      <p className="text-base font-semibold text-ink">{step.instructions}</p>
      {Object.keys(answers).length > 0 && (
        <p className="mt-1 text-sm font-bold text-ink-soft">{correctCount} of {step.items.length} correct so far</p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {step.items.map((item) => {
          const chosen = answers[item.id];
          const isChecked = chosen !== undefined;
          const isCorrect = chosen === item.correctCategory;
          return (
            <div
              key={item.id}
              className={`rounded-md border-2 bg-white p-4 shadow-soft ${
                isChecked ? (isCorrect ? 'border-teal' : 'border-red-400') : 'border-sand-line'
              }`}
            >
              <p className="font-semibold text-ink">{item.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {step.categories.map((category) => {
                  const isSelected = chosen === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => choose(item.id, category)}
                      className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition ${
                        isSelected
                          ? isCorrect
                            ? 'border-teal bg-teal text-white'
                            : 'border-red-400 bg-red-400 text-white'
                          : 'border-sand-line bg-paper text-ink hover:border-ink/30'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
              {isChecked && !isCorrect && (
                <p className="mt-2 text-xs font-semibold text-red-500">Not quite -- try another category.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
