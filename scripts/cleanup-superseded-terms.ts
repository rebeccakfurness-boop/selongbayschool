import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql, ensureSchema } from '../src/lib/db';

/** Removes leftover curriculum_terms rows for the 27 classes/subjects the real teaching export
 * covers (see manifest.json) that are NOT part of that import -- e.g. an earlier hand-authored
 * "Term 1 (draft)" programme for the same class/subject, predating the real data. Scoped tightly:
 * only touches (class_name, subject) pairs the manifest actually lists, and within those, only
 * term_label values other than the real import's own "Term 1"/"Term 2"/"Term 3" -- never touches
 * Secondary classes or anything else outside that 27-class set.
 *
 * Usage:
 *   npm run db:cleanup-superseded-terms -- <path-to-export-dir>       (list only, no deletion)
 *   npm run db:cleanup-superseded-terms -- <path-to-export-dir> --delete
 */

interface ManifestClass {
  short: string;
}
interface ManifestGroup {
  label: string;
  classes: ManifestClass[];
}
interface Manifest {
  groups: ManifestGroup[];
}

async function main() {
  const args = process.argv.slice(2);
  const doDelete = args.includes('--delete');
  const [exportDir] = args.filter((a) => !a.startsWith('--'));
  if (!exportDir) {
    console.error('Usage: npm run db:cleanup-superseded-terms -- <path-to-export-dir> [--delete]');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(join(exportDir, 'manifest.json'), 'utf8')) as Manifest;
  const pairs = manifest.groups.flatMap((g) => g.classes.map((c) => ({ className: g.label, subject: c.short })));

  await ensureSchema();

  const classNames = [...new Set(pairs.map((p) => p.className))];
  const rows = (await sql`
    SELECT id, class_name, subject, term_label,
      (SELECT count(*)::int FROM curriculum_term_units u WHERE u.term_id = t.id) AS unit_count,
      (SELECT count(*)::int FROM curriculum_unit_lessons l JOIN curriculum_term_units u ON u.id = l.unit_id WHERE u.term_id = t.id) AS lesson_count
    FROM curriculum_terms t
    WHERE class_name = ANY(${classNames}) AND term_label NOT IN ('Term 1', 'Term 2', 'Term 3')
    ORDER BY class_name, subject, term_label
  `) as unknown as { id: number; class_name: string; subject: string; term_label: string; unit_count: number; lesson_count: number }[];

  const pairSet = new Set(pairs.map((p) => `${p.className}::${p.subject}`));
  const matches = rows.filter((r) => pairSet.has(`${r.class_name}::${r.subject}`));

  if (matches.length === 0) {
    console.log('No superseded terms found for the 27 real-import classes/subjects. Nothing to do.');
    return;
  }

  console.log(`${doDelete ? 'Deleting' : 'Found (dry run -- add --delete to actually remove)'} ${matches.length} superseded term(s):\n`);
  for (const r of matches) {
    console.log(`  [id ${r.id}] ${r.class_name} / ${r.subject} / "${r.term_label}" -- ${r.unit_count} units, ${r.lesson_count} lessons`);
  }

  if (doDelete) {
    const ids = matches.map((r) => r.id);
    await sql`DELETE FROM curriculum_terms WHERE id = ANY(${ids})`;
    console.log(`\nDeleted ${ids.length} term(s) and everything under them.`);
  } else {
    console.log('\nNothing deleted. Re-run with --delete once this list looks right.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
