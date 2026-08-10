export interface EnrichmentQuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  hint?: string;
}

/** Matched against an already-imported lesson by (className, subject, unitTitle, lessonTitle) --
 * see curriculum-enrichment-seed.ts for why matching by title rather than id, and the import
 * route for how a non-match is handled. */
export interface EnrichmentLessonSeed {
  className: string;
  subject: string;
  unitTitle: string;
  lessonTitle: string;
  equipmentNote: string;
  starterQuiz: EnrichmentQuizQuestion[];
  exitQuiz: EnrichmentQuizQuestion[];
}
