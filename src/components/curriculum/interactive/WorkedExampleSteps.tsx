import type { WorkedExampleStep } from '@/lib/interactive-content-types';

export default function WorkedExampleSteps({ step }: { step: WorkedExampleStep }) {
  const lastIndex = step.steps.length - 1;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink">{step.title}</h2>
      <ol className="mt-5 flex flex-col gap-3">
        {step.steps.map((line, i) => {
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
                {i + 1}
              </span>
              <p className={`text-sm leading-relaxed ${isFinal ? 'font-bold text-ink' : 'text-ink-soft'}`}>{line}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
