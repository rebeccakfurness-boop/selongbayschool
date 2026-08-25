'use client';

import { useState } from 'react';
import type { InteractiveCalculatorStep } from '@/lib/interactive-content-types';

/** Scenario buttons swap between pre-computed values -- see CalculatorScenario's own comment on
 * why this doesn't evaluate a stored formula. */
export default function InteractiveCalculator({ step }: { step: InteractiveCalculatorStep }) {
  const [scenarioId, setScenarioId] = useState(step.scenarios[0]?.id ?? null);
  const scenario = step.scenarios.find((s) => s.id === scenarioId) ?? step.scenarios[0];

  return (
    <div className="rounded-md border-2 border-teal/30 bg-teal/10 p-6">
      <h2 className="font-display text-2xl font-bold text-ink">{step.title}</h2>
      {step.description && <p className="mt-2 text-sm text-ink-soft">{step.description}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {step.scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScenarioId(s.id)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
              s.id === scenario?.id ? 'border-teal bg-teal text-white' : 'border-sand-line bg-white text-ink hover:border-teal/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {scenario && (
        <div className="mt-5 rounded-md bg-white p-5 shadow-soft">
          <div className="grid gap-2 sm:grid-cols-2">
            {scenario.inputs.map((input) => (
              <div key={input.label}>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{input.label}</p>
                <p className="text-sm font-semibold text-ink">{input.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-sand-line pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">{scenario.result.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{scenario.result.value}</p>
          </div>
        </div>
      )}
    </div>
  );
}
