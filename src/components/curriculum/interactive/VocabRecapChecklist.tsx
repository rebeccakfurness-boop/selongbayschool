'use client';

import { useState } from 'react';
import type { RecapChecklistStep } from '@/lib/interactive-content-types';
import type { CurriculumFlashcard } from '@/lib/curriculum';

function VocabFlashcard({ card }: { card: CurriculumFlashcard }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className={`flex min-h-[110px] flex-col items-center justify-center rounded-md border-2 p-4 text-center transition-colors ${
        flipped ? 'border-orange-deep bg-orange/10' : 'border-teal/30 bg-teal/10'
      }`}
    >
      {flipped ? (
        <p className="text-sm leading-snug text-ink">{card.definition}</p>
      ) : (
        <p className="font-display text-lg font-bold text-ink">{card.term}</p>
      )}
    </button>
  );
}

/** Closing step: the lesson's summary points, its full flashcard deck (curriculum_lesson_flashcards
 * -- see that table's own schema comment on why the deck lives here rather than as scattered
 * inline flip cards), and a homework checklist. */
export default function VocabRecapChecklist({
  step,
  flashcards,
}: {
  step: RecapChecklistStep;
  flashcards: CurriculumFlashcard[];
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border-2 border-teal/30 bg-teal/10 p-6">
        <h2 className="font-display text-2xl font-bold text-ink">What you learned</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {step.summaryPoints.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-0.5 text-teal-deep" aria-hidden="true">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {flashcards.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Vocabulary recap</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {flashcards.map((card) => (
              <VocabFlashcard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-md border-2 border-orange/30 bg-orange/10 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Homework checklist</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {step.homeworkItems.map((item, i) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center gap-3 rounded-md bg-white/70 px-3 py-2 text-left text-sm text-ink hover:bg-white"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ${
                    checked.has(i) ? 'border-orange-deep bg-orange-deep text-white' : 'border-ink/30 bg-white'
                  }`}
                >
                  {checked.has(i) ? '✓' : ''}
                </span>
                <span className={checked.has(i) ? 'text-ink-soft line-through' : ''}>{item}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
