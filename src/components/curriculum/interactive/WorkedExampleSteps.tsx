import type { WorkedExampleStep } from '@/lib/interactive-content-types';

/** Matches buildStepsList: each row is a short label plus the actual working (shown in
 * monospace, e.g. a calculation line), with the last row auto-highlighted as the final answer. */
export default function WorkedExampleSteps({ step }: { step: WorkedExampleStep }) {
  const lastIndex = step.steps.length - 1;

  return (
    <ol className="flex flex-col gap-3">
      {step.steps.map((row, i) => {
        const isFinal = i === lastIndex;
        return (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-md border-2 p-4 ${
              isFinal ? 'border-orange-deep bg-orange/15' : 'border-sand-line bg-white'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isFinal ? 'bg-orange-deep text-white' : 'bg-ink/10 text-ink'
              }`}
            >
              {isFinal ? '✓' : i + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{row.label}</p>
              <p className={`mt-0.5 font-mono text-[13px] leading-relaxed ${isFinal ? 'font-bold text-orange-deep' : 'text-ink-soft'}`}>
                {row.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
