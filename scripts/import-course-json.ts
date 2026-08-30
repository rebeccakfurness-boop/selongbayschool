import { readFileSync } from 'node:fs';
import { ensureSchema } from '../src/lib/db';
import { importCourseRequestSchema } from '../src/lib/validation';
import { generateCurriculumTerm, StaticContentGenerationProvider, type GenerateCurriculumTermInput } from '../src/lib/curriculum-generation';

/** Direct-to-DB counterpart of POST /api/admin/curriculum/import, for loading pre-authored
 * course JSON files (see curriculum-imports/) without going through the admin UI or a staff
 * session -- same free, no-LLM pipeline (StaticContentGenerationProvider -> generateCurriculumTerm:
 * real pacing, DB insertion, needs_review gating, docx/PDF worksheet generation).
 *
 * Usage: npm run db:import-course -- <path-to-course.json> [more-paths...]
 *   e.g. npm run db:import-course -- curriculum-imports/primary-1/art-design-term-1.json
 *        npm run db:import-course -- curriculum-imports/primary-1/*.json
 *
 * Every lesson lands as review_status = 'needs_review', same as any other generate() run --
 * nothing this script writes is live to a parent or student until a teacher publishes it via
 * the admin authoring page. */
async function importOne(path: string): Promise<boolean> {
  console.log(`\n=== ${path} ===`);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`  Could not read/parse file: ${err instanceof Error ? err.message : err}`);
    return false;
  }

  const body = { course: raw, allowUpdatingExistingTerm: false };
  const parsed = importCourseRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.error('  FAILED schema validation:');
    for (const issue of parsed.error.issues) {
      console.error(`    ${issue.path.join('.')}: ${issue.message}`);
    }
    return false;
  }
  const d = parsed.data;

  const generateInput: GenerateCurriculumTermInput = {
    className: d.course.input.className,
    subject: d.course.input.subject,
    termLabel: d.course.input.termLabel,
    frameworkLabel: d.course.input.frameworkLabel || undefined,
    syllabusText: '',
    allowUpdatingExistingTerm: d.allowUpdatingExistingTerm === true,
  };

  try {
    const provider = new StaticContentGenerationProvider(d.course.content);
    const result = await generateCurriculumTerm(generateInput, provider);

    console.log(`  Imported: ${generateInput.className} / ${generateInput.subject} / "${generateInput.termLabel}"`);
    console.log(`  Term id: ${result.termId}`);
    console.log(`  Units: ${result.unitsCreated}, Lessons: ${result.lessonsCreated}, Quiz questions: ${result.quizQuestionsCreated}, Flashcards: ${result.flashcardsCreated}`);
    console.log(
      `  Pacing: ${result.pacing.sessionCount} session(s) (source: ${result.pacing.source}${
        result.pacing.academicTermLabel ? `, academic term "${result.pacing.academicTermLabel}"` : ''
      })`
    );

    if (result.calculationWarnings.length > 0) {
      console.log('  Warnings (lessons still saved as needs_review):');
      for (const w of result.calculationWarnings) {
        console.log(`    Lesson "${w.lessonTitle}":`);
        for (const warning of w.warnings) console.log(`      - ${warning}`);
      }
    } else {
      console.log('  No step-ordering or calculation warnings.');
    }
    return true;
  } catch (err) {
    console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('Usage: npm run db:import-course -- <path-to-course.json> [more-paths...]');
    process.exit(1);
  }

  await ensureSchema();

  let failures = 0;
  for (const path of paths) {
    const ok = await importOne(path);
    if (!ok) failures++;
  }

  console.log('');
  console.log(`Done. ${paths.length - failures}/${paths.length} course(s) imported.`);
  console.log('Every lesson above is saved as review_status = needs_review. Publish from the admin authoring page once reviewed.');

  if (failures > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
