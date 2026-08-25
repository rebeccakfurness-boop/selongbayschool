'use client';

import { useState } from 'react';
import type { FlipCardStep } from '@/lib/interactive-content-types';

function Card({ card }: { card: FlipCardStep['cards'][number] }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className={`flex min-h-[130px] flex-col items-center justify-center rounded-md border-2 p-5 text-center shadow-soft transition-colors ${
        flipped ? 'border-orange-deep bg-orange/10' : 'border-teal/30 bg-teal/10'
      }`}
    >
      {flipped ? (
        <p className="text-sm leading-snug text-ink">{card.definition}</p>
      ) : (
        <>
          <p className="font-display text-lg font-bold text-ink">{card.term}</p>
          <p className="mt-1.5 text-xs text-ink-soft">{card.hint || 'Tap to reveal ↻'}</p>
        </>
      )}
    </button>
  );
}

/** A grid of several term/definition flip cards -- matches buildFlipGrid, which always renders
 * a data array shown together (e.g. lesson-06's 4 recap flashcards in one step), not one card at
 * a time. The "tap to flip" instruction lives in the step's own `lede` (rendered once by
 * InteractiveLessonStepper's shared header), not duplicated here. */
export default function FlipCard({ step }: { step: FlipCardStep }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {step.cards.map((card) => (
        <Card key={card.term} card={card} />
      ))}
    </div>
  );
}
