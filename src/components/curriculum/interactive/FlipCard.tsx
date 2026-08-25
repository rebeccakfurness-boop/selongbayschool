'use client';

import { useState } from 'react';
import type { FlipCardStep } from '@/lib/interactive-content-types';

/** One inline term/definition flip moment -- distinct from the lesson's full flashcard deck
 * (VocabRecapChecklist), see FlipCardStep's own comment on why. */
export default function FlipCard({ step }: { step: FlipCardStep }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-ink-soft">Tap the card to reveal the definition</p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`mt-4 flex min-h-[220px] w-full max-w-md items-center justify-center rounded-md border-2 p-8 text-center shadow-soft transition-colors ${
          flipped ? 'border-orange-deep bg-orange/10' : 'border-teal/30 bg-teal/10'
        }`}
      >
        {flipped ? (
          <p className="text-base leading-relaxed text-ink">{step.definition}</p>
        ) : (
          <p className="font-display text-3xl font-bold text-ink">{step.term}</p>
        )}
      </button>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
        {flipped ? 'Definition' : 'Term'}
      </p>
    </div>
  );
}
