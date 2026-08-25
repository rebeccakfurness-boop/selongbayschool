import type { ProportionalBarCompareStep } from '@/lib/interactive-content-types';

const TONE_CLASS: Record<'teal' | 'orange' | 'lightteal', string> = {
  teal: 'bg-teal',
  orange: 'bg-orange-deep',
  lightteal: 'bg-lightteal',
};

/** Matches buildBarCompare (e.g. quantity demanded vs. supplied). */
export default function ProportionalBarCompare({ step }: { step: ProportionalBarCompareStep }) {
  const maxValue = Math.max(...step.items.map((item) => item.value), 1) * 1.1;

  return (
    <div className="flex flex-col gap-4">
      {step.items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">{item.label}</span>
            <span className="font-mono font-bold text-ink-soft">
              {item.value}
              {step.unit ? ` ${step.unit}` : ''}
            </span>
          </div>
          <div className="mt-1.5 h-6 w-full overflow-hidden rounded-full bg-sand/40">
            <div
              className={`flex h-full items-center justify-end rounded-full px-2.5 ${TONE_CLASS[item.tone ?? 'teal']}`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            >
              <span className="font-mono text-xs font-bold text-white">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
