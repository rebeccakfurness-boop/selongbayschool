/** Shared shapes for every subject's sample-term seed file (curriculum-seed-mathematics.ts,
 * curriculum-seed-english.ts, curriculum-seed-science.ts) — see curriculum-seed.ts for what these
 * are, why they're all marked "(draft)", and how the import route uses them. */

export interface SampleLessonSeed {
  title: string;
  objectives: string;
}

export interface SampleUnitSeed {
  title: string;
  description: string;
  lessons: SampleLessonSeed[];
}

export interface SampleTermSeed {
  className: string;
  subject: string;
  termLabel: string;
  frameworkLabel: string;
  units: SampleUnitSeed[];
}
