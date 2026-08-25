'use client';

import { useState } from 'react';
import type { TapRevealGridStep } from '@/lib/interactive-content-types';

export default function TapRevealGrid({ step }: { step: TapRevealGridStep }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {step.title && <h2 className="font-display text-2xl font-bold text-ink">{step.title}</h2>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {step.cards.map((card) => {
          const isOpen = expandedId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setExpandedId(isOpen ? null : card.id)}
              className={`rounded-md border-2 p-4 text-left transition ${
                isOpen ? 'border-teal bg-teal/10' : 'border-sand-line bg-white hover:border-teal/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{card.label}</span>
                <span className="text-ink-soft" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </div>
              {isOpen && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.content}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
