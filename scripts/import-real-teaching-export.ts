import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureSchema } from '../src/lib/db';
import { realTeachingExportSchema } from '../src/lib/validation';
import { importRealTeachingExport } from '../src/lib/curriculum-generation/class-curriculum/real-teaching-import';

/** Imports every class in a real, already-fully-authored teaching export (export/manifest.json +
 * export/<group>/<class>.json -- see export/SCHEMA.md alongside the source) as real
 * curriculum_terms/units/lessons -- see real-teaching-import.ts for exactly what each field maps
 * to and why. No AI generation, no scheduling: every lesson already carries its own real date,
 * plan and worksheet, so this is a direct, idempotent field mapping (re-running it fully replaces
 * whatever's currently under each class/subject/term, see real-teaching-import.ts's own comment).
 *
 * Usage:
 *   npm run db:import-real-teaching -- <path-to-export-dir> [options]
 *   e.g. npm run db:import-real-teaching -- curriculum-imports/real-teaching-export
 *
 * Options:
 *   --dry-run          Validate every file and report what would be imported, without touching
 *                        the database (no DATABASE_URL needed for this mode).
 *   --only <group>            Import only this group, e.g. --only primary1
 *   --only <group>/<slug>     Import only this one class, e.g. --only primary1/mathematics
 *   --publish           Land every imported lesson as review_status = 'published' immediately,
 *                        instead of the default 'needs_review'. This content was written and
 *                        checked by a person before export, unlike the AI-generation paths that
 *                        default exists to guard -- and reviewing 3000+ lessons one at a time
 *                        through the admin UI is not realistic. Pass this only once you're
 *                        confident the export itself is right; there's no bulk un-publish.
 *
 * manifest.json's own "group" -> "groupLabel" mapping (primary1 -> "Primary 1", etc.) is used
 * directly as this app's class_name, and each class's "short" field (English, Mathematics, ...)
 * as the subject -- both already match this app's YEAR_LEVELS/PRIMARY_SUBJECTS constants (see
 * src/lib/curriculum-year-levels.ts) exactly, by design of the source's own manifest. */

interface ManifestClass {
  slug: string;
  short: string;
  file: string;
}
interface ManifestGroup {
  group: string;
  label: string;
  classes: ManifestClass[];
}
interface Manifest {
  groups: ManifestGroup[];
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const positionals = args.filter((a) => !a.startsWith('--'));
  const onlyIndex = args.indexOf('--only');
  const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
  const dryRun = flags.has('--dry-run');
  const publish = flags.has('--publish');

  const [exportDir] = positionals;
  if (!exportDir) {
    console.error('Usage: npm run db:import-real-teaching -- <path-to-export-dir> [--dry-run] [--publish] [--only <group>[/<slug>]]');
    process.exit(1);
  }

  const manifestPath = join(exportDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`No manifest.json found at ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;

  const jobs: { className: string; subject: string; file: string }[] = [];
  for (const group of manifest.groups) {
    if (only && !only.startsWith(group.group)) continue;
    for (const cls of group.classes) {
      if (only && only.includes('/') && only !== `${group.group}/${cls.slug}`) continue;
      jobs.push({ className: group.label, subject: cls.short, file: join(exportDir, cls.file) });
    }
  }

  if (jobs.length === 0) {
    console.error(only ? `No classes matched --only ${only}` : 'No classes found in manifest.json');
    process.exit(1);
  }

  console.log(
    `${dryRun ? 'DRY RUN: validating' : 'Importing'} ${jobs.length} class file(s)${only ? ` (--only ${only})` : ''}${
      !dryRun && publish ? ' -- publishing immediately (--publish)' : ''
    }.\n`
  );

  if (!dryRun) await ensureSchema();

  let failures = 0;
  let totalLessons = 0;
  for (const job of jobs) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(job.file, 'utf8'));
    } catch (err) {
      failures++;
      console.error(`FAILED to read/parse ${job.file}: ${err instanceof Error ? err.message : err}`);
      continue;
    }

    const parsed = realTeachingExportSchema.safeParse(raw);
    if (!parsed.success) {
      failures++;
      console.error(`FAILED schema validation (${job.file}):`);
      for (const issue of parsed.error.issues.slice(0, 10)) {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
      }
      continue;
    }
    const data = parsed.data;

    if (dryRun) {
      const terms = new Set(data.lessons.map((l) => l.term));
      console.log(`OK  ${job.className} / ${data.short}: ${data.lessons.length} lessons across ${terms.size} term(s) (${[...terms].join(', ')})`);
      totalLessons += data.lessons.length;
      continue;
    }

    try {
      const result = await importRealTeachingExport(data, job.className, { publish });
      console.log(`${job.className} / ${result.subject}:`);
      for (const t of result.terms) {
        console.log(`  ${t.termLabel} (term id ${t.termId}): ${t.unitsCreated} units, ${t.lessonsCreated} lessons`);
        totalLessons += t.lessonsCreated;
      }
    } catch (err) {
      failures++;
      console.error(`FAILED to import ${job.file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('');
  console.log(`Done. ${jobs.length - failures}/${jobs.length} class file(s) ${dryRun ? 'validated' : 'imported'} OK. ${totalLessons} lessons total.`);
  if (!dryRun) {
    console.log(
      publish
        ? 'Every lesson above is saved as review_status = published (--publish was passed).'
        : 'Every lesson above is saved as review_status = needs_review. Publish from the admin authoring page once reviewed, or re-run with --publish.'
    );
  }
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
