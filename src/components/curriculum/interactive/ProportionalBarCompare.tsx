import type { ProportionalBarCompareStep } from '@/lib/interactive-content-types';

export default function ProportionalBarCompare({ step }: { step: ProportionalBarCompareStep }) {
  const maxValue = Math.max(...step.items.map((item) => item.value), 1);

  return (
    <div>
      {step.title && <h2 className="font-display text-2xl font-bold text-ink">{step.title}</h2>}
      <div className="mt-5 flex flex-col gap-3">
        {step.items.map((item) => (
          <div key={item.label}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-ink">{item.label}</span>
              <span className="font-bold text-ink-soft">
                {item.value}
                {step.unit ? ` ${step.unit}` : ''}
              </span>
            </div>
            <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-sand/40">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${Math.max((item.value / maxValue) * 100, 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
