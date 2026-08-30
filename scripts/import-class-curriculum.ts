import { readFileSync } from 'node:fs';
import { ensureSchema } from '../src/lib/db';
import { classCurriculumImportSchema } from '../src/lib/validation';
import { generateCurriculumTerm, StaticContentGenerationProvider } from '../src/lib/curriculum-generation';
import { buildTermBucketsFromClassCurriculum } from '../src/lib/curriculum-generation/class-curriculum/import';

/** Converter path for DASHBOARDSPEC.md's class-curriculum JSON format (data/<class>.json): a
 * compact, human-authorable file with real Cambridge refs, teaching units and a per-strand
 * timetable, NOT the fully pre-authored shape importCourseRequestSchema/db:import-course expects.
 * This script schedules the file against this app's REAL academic calendar and weekly timetable
 * (src/lib/curriculum-generation/class-curriculum/scheduler.ts -- a TypeScript port of the spec's
 * teaching_days()/pad_unit(), reading academic_terms/academic_calendar_exceptions/class_schedule
 * instead of a hardcoded CALENDAR), derives each lesson's teaching plan and worksheet from
 * rule-based pattern matching on the lesson title (plans.ts/worksheets.ts, ported from the
 * spec's plans.py/worksheets.py), and runs the result through the exact same
 * StaticContentGenerationProvider -> generateCurriculumTerm() pipeline every other static import
 * path already uses. No Anthropic API call anywhere in this path -- see the ported files'
 * comments; nothing here needs or reads ANTHROPIC_API_KEY.
 *
 * Usage:
 *   npm run db:import-class-curriculum -- <path-to-class.json> <className> [options]
 *   e.g. npm run db:import-class-curriculum -- data/science.json "Primary 1"
 *
 * Options:
 *   --allow-update          Add generated units to a term that already exists, instead of erroring.
 *   --source-verified       Mark every curriculum_terms row created as source_verified = true.
 *                            Pass this ONLY after a real person has personally checked the input
 *                            file's refs and content against the actual syllabus -- never as a
 *                            matter of course just because the file went through this path.
 *   --source-note "..."     Attach a note (who verified it, when, against what) alongside
 *                            --source-verified. Stored either way; shown by the admin review UI.
 *
 * A unit whose authored lessons don't fit its allotted teaching slots throws a clear, named error
 * (see padUnit in scheduler.ts) rather than silently truncating the unit -- nothing here ever
 * drops the end of a unit to make the numbers fit. Every lesson still lands as
 * review_status = 'needs_review', same as every other import path -- nothing here is visible to a
 * parent or student until a teacher publishes it via the admin authoring page. */
async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const positionals = args.filter((a) => !a.startsWith('--'));
  const noteIndex = args.indexOf('--source-note');
  const sourceNote = noteIndex >= 0 ? args[noteIndex + 1] : undefined;

  const [path, className] = positionals;
  if (!path || !className) {
    console.error('Usage: npm run db:import-class-curriculum -- <path-to-class.json> <className> [--allow-update] [--source-verified] [--source-note "..."]');
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`Could not read/parse ${path}: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const parsed = classCurriculumImportSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`FAILED schema validation (${path}):`);
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  const input = parsed.data;

  await ensureSchema();

  console.log(`Scheduling: ${className} / ${input.short} (${input.title}${input.code ? ` ${input.code}` : ''})`);
  let buckets;
  try {
    buckets = await buildTermBucketsFromClassCurriculum(input, className, {
      sourceVerified: flags.has('--source-verified') ? true : undefined,
      sourceNote,
    });
  } catch (err) {
    console.error(`\nFAILED to schedule: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  if (buckets.length === 0) {
    console.error('No lessons were scheduled -- check the file has at least one strand with teaching days and units.');
    process.exit(1);
  }

  if (flags.has('--source-verified')) {
    console.log(`  Marking source_verified = true${sourceNote ? ` (${sourceNote})` : ''}.`);
  } else {
    console.log('  source_verified left unset -- pass --source-verified once a real person has checked this file against the real syllabus.');
  }

  let failures = 0;
  for (const bucket of buckets) {
    console.log(`\n=== ${bucket.termLabel} ===`);
    try {
      const provider = new StaticContentGenerationProvider(bucket.content);
      const result = await generateCurriculumTerm({ ...bucket.generateInput, allowUpdatingExistingTerm: flags.has('--allow-update') }, provider);

      console.log(`  Imported: ${bucket.generateInput.className} / ${bucket.generateInput.subject} / "${bucket.termLabel}"`);
      console.log(`  Term id: ${result.termId}`);
      console.log(`  Units: ${result.unitsCreated}, Lessons: ${result.lessonsCreated}, Quiz questions: ${result.quizQuestionsCreated}, Flashcards: ${result.flashcardsCreated}`);

      if (result.calculationWarnings.length > 0) {
        console.log('  Warnings (lessons still saved as needs_review):');
        for (const w of result.calculationWarnings) {
          console.log(`    Lesson "${w.lessonTitle}":`);
          for (const warning of w.warnings) console.log(`      - ${warning}`);
        }
      } else {
        console.log('  No step-ordering or calculation warnings.');
      }
    } catch (err) {
      failures++;
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('');
  console.log(`Done. ${buckets.length - failures}/${buckets.length} term(s) imported.`);
  console.log('Every lesson above is saved as review_status = needs_review. Publish from the admin authoring page once reviewed.');
  if (failures > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
