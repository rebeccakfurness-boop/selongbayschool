'use client';

import { useState } from 'react';
import type { GuessRevealCardData, GuessRevealStep, RevealCardTag } from '@/lib/interactive-content-types';

const TAG_STYLES: Record<RevealCardTag['tone'], string> = {
  up: 'bg-teal/15 text-teal-deep',
  down: 'bg-orange/15 text-orange-deep',
  neutral: 'bg-sand/60 text-ink-soft',
};

/** revealed always starts false and only ever flips true from a click -- the answer is never
 * rendered open on first paint, keeping "never shows the answer before the question" true for
 * every card regardless of how the lesson is loaded (matches buildRevealCards' own .reveal-ans
 * being display:none until .open is added by a click). */
function Card({ card }: { card: GuessRevealCardData }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-md border-2 border-lime-600/30 bg-lime-50 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{card.question}</p>
        {!revealed && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="shrink-0 rounded-full bg-orange-deep px-4 py-1.5 text-xs font-bold text-white hover:bg-orange"
          >
            Reveal answer
          </button>
        )}
      </div>
      {revealed && (
        <div className="mt-3 border-t border-dashed border-ink/15 pt-3">
          {card.tags && card.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <span key={tag.label} className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${TAG_STYLES[tag.tone]}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm leading-relaxed text-ink-soft">{card.answer}</p>
        </div>
      )}
    </div>
  );
}

/** A set of guess-then-reveal cards shown together -- matches buildRevealCards. */
export default function GuessRevealCard({ step }: { step: GuessRevealStep }) {
  return (
    <div className="flex flex-col gap-3">
      {step.cards.map((card, i) => (
        <Card key={i} card={card} />
      ))}
    </div>
  );
}
