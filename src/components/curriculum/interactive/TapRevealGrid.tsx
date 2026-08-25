'use client';

import { useState } from 'react';
import type { TapRevealGridStep } from '@/lib/interactive-content-types';

/** Matches buildShiftGrid -- e.g. the 5 "Characteristics of a Market Economy" cards, each
 * tapped open to reveal its description. */
export default function TapRevealGrid({ step }: { step: TapRevealGridStep }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {step.cards.map((card) => {
        const isOpen = expandedId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => setExpandedId(isOpen ? null : card.id)}
            className={`rounded-md border-2 p-4 text-center transition ${
              isOpen ? 'border-orange-deep bg-orange/10' : 'border-sand-line bg-white hover:border-teal/40'
            }`}
          >
            {card.icon && <p className="text-2xl">{card.icon}</p>}
            <p className="mt-1 font-display text-sm font-bold text-ink">{card.label}</p>
            {isOpen && <p className="mt-2 text-xs leading-relaxed text-ink-soft">{card.content}</p>}
          </button>
        );
      })}
    </div>
  );
}
