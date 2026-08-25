'use client';

import { useState } from 'react';
import type { SortClassifyStep } from '@/lib/interactive-content-types';

/** Tap-to-classify rather than drag-and-drop -- no drag-and-drop library is in this project's
 * dependencies, and tapping a category button per item gives the same "instant correct/wrong
 * feedback" buildSortActivity has, with a much simpler, more mobile-friendly interaction. Once
 * answered, `reason` is always shown (correct or not) -- matches buildSortActivity's own
 * .sort-reason, which is never hidden just because the answer was right. */
export default function SortClassifyActivity({ step }: { step: SortClassifyStep }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function choose(itemId: string, category: string) {
    setAnswers((a) => ({ ...a, [itemId]: category }));
  }

  const correctCount = step.items.filter((item) => answers[item.id] === item.correctCategory).length;

  return (
    <div>
      {Object.keys(answers).length > 0 && (
        <p className="mb-3 text-sm font-bold text-ink-soft">{correctCount} of {step.items.length} correct so far</p>
      )}

      <div className="flex flex-col gap-3">
        {step.items.map((item) => {
          const chosen = answers[item.id];
          const isChecked = chosen !== undefined;
          const isCorrect = chosen === item.correctCategory;
          return (
            <div
              key={item.id}
              className={`rounded-md border-2 bg-white p-4 shadow-soft ${
                isChecked ? (isCorrect ? 'border-teal' : 'border-orange-deep') : 'border-sand-line'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-ink">{item.label}</p>
                <div className="flex flex-wrap gap-2">
                  {step.categories.map((category) => {
                    const isSelected = chosen === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        disabled={isChecked}
                        onClick={() => choose(item.id, category)}
                        className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition disabled:cursor-default ${
                          isSelected
                            ? isCorrect
                              ? 'border-teal bg-teal text-white'
                              : 'border-orange-deep bg-orange-deep text-white'
                            : 'border-sand-line bg-paper text-ink-soft hover:border-ink/30 disabled:opacity-40'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
              {isChecked && <p className="mt-2.5 text-sm text-ink-soft">{item.reason}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
