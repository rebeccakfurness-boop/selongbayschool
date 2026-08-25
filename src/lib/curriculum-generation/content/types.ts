import type { GenerateCurriculumTermInput } from '../types';
import type { AuthoredTermContent } from '../static-provider';

/** What one authored-content file under src/lib/curriculum-generation/content/ exports -- the
 * term-level metadata (class/subject/term label, syllabus text) plus the actual authored lesson
 * content, bundled together so scripts/generate-curriculum-term.ts only needs a module path. */
export interface CurriculumTermContentModule {
  input: GenerateCurriculumTermInput;
  content: AuthoredTermContent;
}
