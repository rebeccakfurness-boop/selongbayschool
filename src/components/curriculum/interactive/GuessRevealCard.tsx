'use client';

import { useState } from 'react';
import type { GuessRevealStep } from '@/lib/interactive-content-types';

export default function GuessRevealCard({ step }: { step: GuessRevealStep }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-md border-2 border-lime-600/30 bg-lime-50 p-6">
      <h2 className="font-display text-2xl font-bold text-ink">{step.question}</h2>
      <p className="mt-3 text-sm text-ink-soft">Have a guess first, then reveal the answer.</p>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85"
        >
          Reveal answer →
        </button>
      ) : (
        <div className="mt-5 rounded-md bg-white p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">Answer</p>
          <p className="mt-1 text-base font-semibold text-ink">{step.answer}</p>
          {step.workedSolution && (
            <>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-teal-deep">Worked solution</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{step.workedSolution}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
