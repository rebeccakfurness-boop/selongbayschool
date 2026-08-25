'use client';

import { useState } from 'react';
import type { InteractiveCalculatorStep } from '@/lib/interactive-content-types';

/** Matches buildReader: scenario buttons swap between pre-computed readouts -- see
 * CalculatorScenario's own comment on why this doesn't evaluate a stored formula. */
export default function InteractiveCalculator({ step }: { step: InteractiveCalculatorStep }) {
  const [scenarioId, setScenarioId] = useState(step.scenarios[0]?.id ?? null);
  const scenario = step.scenarios.find((s) => s.id === scenarioId) ?? step.scenarios[0];

  return (
    <div className="rounded-md border-2 border-teal/30 bg-teal/10 p-6">
      <div className="flex flex-wrap gap-2">
        {step.scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScenarioId(s.id)}
            className={`rounded-full border-2 px-4 py-2 font-mono text-sm font-semibold transition ${
              s.id === scenario?.id ? 'border-teal bg-teal text-white' : 'border-sand-line bg-white text-ink hover:border-teal/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {scenario && (
        <div className="mt-5 flex flex-wrap gap-4">
          {scenario.readouts.map((readout) => (
            <div key={readout.label} className="min-w-[140px] flex-1 rounded-md bg-white p-4 shadow-soft">
              <p className="font-mono text-2xl font-bold text-teal-deep">{readout.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink-soft">{readout.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
