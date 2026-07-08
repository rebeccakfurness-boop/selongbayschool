import { admissionsSteps } from '@/lib/site-content';

export default function AdmissionsStepper() {
  return (
    <ol className="relative flex flex-col gap-8 md:gap-10">
      <div className="absolute bottom-6 left-5 top-6 hidden w-px bg-sand-line md:block" aria-hidden="true" />
      {admissionsSteps.map((step, i) => (
        <li key={step.title} className="relative flex gap-5">
          <span className="z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal font-display text-lg font-semibold text-white">
            {i + 1}
          </span>
          <div className="pt-1">
            <h3 className="font-display text-lg font-semibold text-ink">{step.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
