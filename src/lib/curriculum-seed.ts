/** Draft sample terms for the Curriculum Plans feature — Mathematics, English, and Science across
 * Primary 1 through Primary 6 and Secondary 6 through Secondary 10, organised around the Cambridge
 * curriculum frameworks' stage-by-stage progression (Primary 1 = Cambridge Primary Stage 1, ...
 * Primary 6 = Stage 6, Secondary 6–8 = Cambridge Lower Secondary Stages 7–9, Secondary 9–10 =
 * Cambridge IGCSE Years 1–2), plus a standalone introductory Economics sequence for Secondary 6 and
 * Secondary 8 (Economics isn't part of Cambridge's Primary/Lower Secondary frameworks, so that one
 * isn't stage-mapped the same way — see curriculum-seed-economics.ts). See the per-subject files
 * (curriculum-seed-mathematics.ts, curriculum-seed-english.ts, curriculum-seed-science.ts,
 * curriculum-seed-economics.ts) for the actual content and their own notes on scope.
 *
 * This is original lesson-plan writing informed by the publicly known structure/objectives of
 * that framework — not a reproduction of Cambridge's own copyrighted materials. It exists so the
 * Curriculum Plans feature has real worked examples rather than an empty screen, and every one is
 * explicitly a DRAFT: every unit/lesson needs a teacher's review (and each lesson still needs its
 * actual worksheet attached) before being relied on for real teaching.
 *
 * Imported only when an admin clicks "Import sample term" — never seeded automatically. Safe to
 * click more than once: each programme is skipped individually if it already exists, via
 * curriculum_terms' own (class, subject, term) uniqueness constraint, so a partial import or a
 * re-run after adding more subjects never duplicates anything already there.
 */

export type { SampleLessonSeed, SampleUnitSeed, SampleTermSeed } from './curriculum-seed-types';
import type { SampleTermSeed } from './curriculum-seed-types';
import { MATHEMATICS_TERMS } from './curriculum-seed-mathematics';
import { ENGLISH_TERMS } from './curriculum-seed-english';
import { SCIENCE_TERMS } from './curriculum-seed-science';
import { ECONOMICS_TERMS } from './curriculum-seed-economics';

export const SAMPLE_TERMS: SampleTermSeed[] = [...MATHEMATICS_TERMS, ...ENGLISH_TERMS, ...SCIENCE_TERMS, ...ECONOMICS_TERMS];
