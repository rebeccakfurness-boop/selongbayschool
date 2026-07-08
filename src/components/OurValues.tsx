import type { ReactNode } from 'react';
import { values, ourCommitment } from '@/lib/site-content';

const icons: Record<string, ReactNode> = {
  Humility: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Kindness: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Integrity: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Agency: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
};

export default function OurValues() {
  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8">
      <p className="font-script text-3xl text-orange-deep md:text-4xl">Our values</p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Selong Bay School Values</h2>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {values.map((value) => (
          <div key={value.name} className="flex flex-col rounded-md border border-sand-line bg-paper p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-aqua/50 text-teal-deep">
                {icons[value.name]}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">{value.name}</h3>
                <p className="text-sm font-bold uppercase tracking-wide text-teal-deep">{value.tagline}</p>
              </div>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{value.description}</p>

            <p className="mt-4 text-sm font-bold text-ink">At Selong Bay School, {value.name.toLowerCase()} means we:</p>
            <ul className="mt-2 space-y-1.5">
              {value.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-[14.5px] text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>

            <p className="mt-5 border-l-2 border-orange pl-4 font-display text-[15px] italic text-teal-deep">
              &ldquo;{value.quote}&rdquo;
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-teal-deep px-7 py-9 text-center shadow-soft md:px-14 md:py-12">
        <p className="font-script text-2xl text-orange md:text-3xl">Our commitment</p>
        <div className="mx-auto mt-3 max-w-3xl space-y-4 text-[15px] leading-relaxed text-white/90 md:text-[16px]">
          {ourCommitment.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
