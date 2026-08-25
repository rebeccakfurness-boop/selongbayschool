import { ensureSchema } from '../src/lib/db';
import { generateCurriculumTerm } from '../src/lib/curriculum-generation';
import { StaticContentGenerationProvider } from '../src/lib/curriculum-generation/static-provider';
import type { CurriculumTermContentModule } from '../src/lib/curriculum-generation/content/types';

/** Entrypoint for the initial rollout of the curriculum generation engine: runs
 * generateCurriculumTerm()'s real pipeline (pacing, upsert, UNIQUE-constraint handling,
 * calculation verification, step-ordering validation) exactly as built, backed by
 * StaticContentGenerationProvider instead of a live LLM-backed one -- see that class's own
 * comment. The actual lesson content (interactive_content, teaching_script, quiz questions,
 * flashcards) comes from a hand-authored module under src/lib/curriculum-generation/content/,
 * not from an API call.
 *
 * Usage: npm run db:generate-curriculum -- <content-module-name>
 *   e.g. npm run db:generate-curriculum -- smoke-test
 *        npm run db:generate-curriculum -- primary-1-mathematics
 *
 * Every lesson this inserts lands as review_status = 'needs_review', same as any other
 * generate() run -- nothing this script writes is live to a parent or student until a teacher
 * publishes it via the admin authoring page. */
async function loadContentModule(name: string): Promise<CurriculumTermContentModule> {
  const mod = (await import(`../src/lib/curriculum-generation/content/${name}`)) as {
    default: CurriculumTermContentModule;
  };
  if (!mod.default) {
    throw new Error(`src/lib/curriculum-generation/content/${name}.ts must have a default export (see content/types.ts).`);
  }
  return mod.default;
}

async function main() {
  const moduleName = process.argv[2];
  if (!moduleName) {
    console.error('Usage: npm run db:generate-curriculum -- <content-module-name>');
    console.error('e.g.:  npm run db:generate-curriculum -- smoke-test');
    process.exit(1);
  }

  const { input, content } = await loadContentModule(moduleName);
  const provider = new StaticContentGenerationProvider(content);

  console.log(`Generating: ${input.className} / ${input.subject} / "${input.termLabel}"`);
  await ensureSchema();
  const result = await generateCurriculumTerm(input, provider);

  console.log('');
  console.log(`Term id: ${result.termId}`);
  console.log(`Units created: ${result.unitsCreated}`);
  console.log(`Lessons created: ${result.lessonsCreated}`);
  console.log(`Quiz questions created: ${result.quizQuestionsCreated}`);
  console.log(`Flashcards created: ${result.flashcardsCreated}`);
  console.log(
    `Pacing: ${result.pacing.sessionCount} session(s) (source: ${result.pacing.source}${
      result.pacing.academicTermLabel ? `, academic term "${result.pacing.academicTermLabel}"` : ''
    })`
  );

  if (result.workbookMasteryProposals.length > 0) {
    console.log('');
    console.log('Workbook mastery proposals (NOT applied -- confirm with the teacher before skipping any of these):');
    for (const p of result.workbookMasteryProposals) {
      console.log(`  - [${p.confidence}] ${p.topicTitle}: ${p.evidence}`);
    }
  }

  if (result.calculationWarnings.length > 0) {
    console.log('');
    console.log('Warnings (step ordering / calculation mismatches -- lessons still saved as needs_review):');
    for (const w of result.calculationWarnings) {
      console.log(`  Lesson "${w.lessonTitle}":`);
      for (const warning of w.warnings) console.log(`    - ${warning}`);
    }
  } else {
    console.log('');
    console.log('No step-ordering or calculation warnings.');
  }

  console.log('');
  console.log('Every lesson above is saved as review_status = needs_review. Publish from the admin authoring page once reviewed.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
