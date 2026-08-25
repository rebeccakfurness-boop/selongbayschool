import type { ExplanationStep } from '@/lib/interactive-content-types';

/** Definition + worked example, always authored (by the generation engine's ordering rule) before
 * any later step that tests the same concept -- see ExplanationStep's own comment. Title/kicker/
 * lede are rendered once by InteractiveLessonStepper's shared step header, not here. */
export default function ExplanationCard({ step }: { step: ExplanationStep }) {
  return (
    <div className="rounded-md border-2 border-teal/30 bg-teal/10 p-6">
      <p className="text-base leading-relaxed text-ink">{step.definition}</p>
      <div className="mt-5 rounded-md bg-white p-4 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">Example</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.example}</p>
      </div>
    </div>
  );
}
