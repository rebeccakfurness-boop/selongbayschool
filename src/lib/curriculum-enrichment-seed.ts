export type { EnrichmentQuizQuestion, EnrichmentLessonSeed } from './curriculum-enrichment-types';
import type { EnrichmentLessonSeed } from './curriculum-enrichment-types';
import { MATHEMATICS_ENRICHMENT } from './curriculum-enrichment-mathematics';
import { ENGLISH_ENRICHMENT } from './curriculum-enrichment-english';

/** Draft "Complete online" content (equipment note + starter/exit quiz questions) for every lesson
 * in the Primary 1 and Primary 2 Mathematics and English programmes -- see the per-subject files
 * for the actual content. Separate from curriculum-seed.ts (which creates the terms/units/lessons
 * themselves) so this can be imported afterwards against whatever lessons already exist, matched
 * by (class, subject, unit title, lesson title) rather than by id -- ids aren't known ahead of
 * time since curriculum-seed.ts's import route assigns them at insert time.
 *
 * Imported only when an admin clicks "Add quiz content" -- never automatic. Safe to click more
 * than once: any lesson that already has quiz questions is left alone rather than duplicating, and
 * a lesson title that doesn't match anything currently imported is simply skipped and reported
 * back, rather than erroring the whole batch.
 */
export const ENRICHMENT_LESSONS: EnrichmentLessonSeed[] = [...MATHEMATICS_ENRICHMENT, ...ENGLISH_ENRICHMENT];
