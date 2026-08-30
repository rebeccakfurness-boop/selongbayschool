import { ensureSchema, sql } from '../src/lib/db';
import { generateAndAttachWorksheetFiles } from '../src/lib/curriculum-generation';
import type { CurriculumTermContentModule } from '../src/lib/curriculum-generation/content/types';

/** Generates and attaches real .docx/PDF worksheet files (see ./generate-curriculum-term.ts's own
 * comment on why a content module carries hand-authored content) for lessons that already exist in
 * the database but don't have worksheet files yet -- unlike generate-curriculum-term.ts, this never
 * inserts a term/unit/lesson row: it only fills in worksheet_content/worksheet_docx_url/
 * worksheet_pdf_url on rows that are already there, matched by exact lesson title within the
 * module's own (className, subject, termLabel) term. Safe to re-run: a lesson that already has a
 * worksheet_docx_url is skipped, not regenerated.
 *
 * Usage: npm run db:backfill-worksheet-files -- <content-module-name>
 *   e.g. npm run db:backfill-worksheet-files -- economics-0455-tom */
async function loadContentModule(name: string): Promise<CurriculumTermContentModule> {
  const mod = (await import(`../src/lib/curriculum-generation/content/${name}`)) as {
    default: CurriculumTermContentModule;
  };
  if (!mod.default) {
    throw new Error(`src/lib/curriculum-generation/content/${name}.ts must have a default export (see content/types.ts).`);
  }
  return mod.default;
}

interface LessonRow {
  id: number;
  title: string;
  worksheet_docx_url: string | null;
}

async function main() {
  const moduleName = process.argv[2];
  if (!moduleName) {
    console.error('Usage: npm run db:backfill-worksheet-files -- <content-module-name>');
    console.error('e.g.:  npm run db:backfill-worksheet-files -- economics-0455-tom');
    process.exit(1);
  }

  const { input, content } = await loadContentModule(moduleName);

  const worksheetByTitle = new Map<string, NonNullable<(typeof content.units)[string]['lessons'][number]['worksheetContent']>>();
  for (const unit of Object.values(content.units)) {
    for (const lesson of unit.lessons) {
      if (lesson.worksheetContent) worksheetByTitle.set(lesson.title, lesson.worksheetContent);
    }
  }

  if (worksheetByTitle.size === 0) {
    console.log(`No lessons in ${moduleName} have worksheetContent -- nothing to backfill.`);
    return;
  }

  console.log(`Looking up: ${input.className} / ${input.subject} / "${input.termLabel}"`);
  await ensureSchema();

  const [term] = (await sql`
    SELECT id FROM curriculum_terms WHERE class_name = ${input.className} AND subject = ${input.subject} AND term_label = ${input.termLabel}
  `) as unknown as { id: number }[];
  if (!term) {
    console.error(`No programme found for ${input.className} / ${input.subject} / "${input.termLabel}" -- generate it first.`);
    process.exit(1);
  }

  const lessons = (await sql`
    SELECT l.id, l.title, l.worksheet_docx_url
    FROM curriculum_unit_lessons l
    JOIN curriculum_term_units u ON u.id = l.unit_id
    WHERE u.term_id = ${term.id}
  `) as unknown as LessonRow[];

  let attached = 0;
  let skippedExisting = 0;
  let skippedNoContent = 0;

  for (const lesson of lessons) {
    const worksheetContent = worksheetByTitle.get(lesson.title);
    if (!worksheetContent) {
      skippedNoContent++;
      continue;
    }
    if (lesson.worksheet_docx_url) {
      skippedExisting++;
      continue;
    }
    console.log(`Generating worksheet files for "${lesson.title}"…`);
    await generateAndAttachWorksheetFiles(lesson.id, worksheetContent, lesson.title);
    attached++;
  }

  console.log('');
  console.log(`Done. ${attached} lesson(s) got new worksheet files, ${skippedExisting} already had them, ${skippedNoContent} had no matching worksheetContent.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
