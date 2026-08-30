import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql, ensureSchema } from '../src/lib/db';

/** Tidies up curriculum_terms in two ways, both scoped to curriculum content only -- never
 * touches children/family data, class_schedule, or staff assignments:
 *
 * 1. Superseded: for the classes/subjects the real teaching export covers (see manifest.json),
 *    any term_label other than the real import's own "Term 1"/"Term 2"/"Term 3" -- e.g. an
 *    earlier hand-authored "Term 1 (draft)" programme for the same class/subject, predating the
 *    real data.
 * 2. Out of scope: any curriculum_terms row at all whose class_name isn't one of the 9 kept year
 *    levels (KEEP_CLASSES below) -- e.g. leftover programmes for Secondary 6, Secondary 10/11,
 *    Kindergarten, or any of the school's other real-world class_name variants. Untouched:
 *    anything under a kept class_name, whatever its subject (so Secondary 8's separate Economics
 *    programme, for instance, is never at risk here).
 *
 * Usage:
 *   npm run db:cleanup-superseded-terms -- <path-to-export-dir>       (list only, no deletion)
 *   npm run db:cleanup-superseded-terms -- <path-to-export-dir> --delete
 */

const KEEP_CLASSES = [
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'Secondary 7',
  'Secondary 8',
  'Secondary 9',
];

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
  const pairSet = new Set(pairs.map((p) => `${p.className}::${p.subject}`));

  await ensureSchema();

  const rows = (await sql`
    SELECT id, class_name, subject, term_label,
      (SELECT count(*)::int FROM curriculum_term_units u WHERE u.term_id = t.id) AS unit_count,
      (SELECT count(*)::int FROM curriculum_unit_lessons l JOIN curriculum_term_units u ON u.id = l.unit_id WHERE u.term_id = t.id) AS lesson_count
    FROM curriculum_terms t
    ORDER BY class_name, subject, term_label
  `) as unknown as { id: number; class_name: string; subject: string; term_label: string; unit_count: number; lesson_count: number }[];

  const superseded = rows.filter(
    (r) => pairSet.has(`${r.class_name}::${r.subject}`) && !['Term 1', 'Term 2', 'Term 3'].includes(r.term_label)
  );
  const outOfScope = rows.filter((r) => !KEEP_CLASSES.includes(r.class_name));

  const byId = new Map<number, (typeof rows)[number] & { reason: string }>();
  for (const r of superseded) byId.set(r.id, { ...r, reason: 'superseded draft' });
  for (const r of outOfScope) byId.set(r.id, { ...r, reason: byId.has(r.id) ? 'superseded draft, out-of-scope class' : 'out-of-scope class' });
  const matches = [...byId.values()];

  if (matches.length === 0) {
    console.log('Nothing to clean up -- every curriculum_terms row is either a kept class or a real "Term 1/2/3" programme.');
    return;
  }

  console.log(`${doDelete ? 'Deleting' : 'Found (dry run -- add --delete to actually remove)'} ${matches.length} term(s):\n`);
  for (const r of matches) {
    console.log(`  [id ${r.id}] ${r.class_name} / ${r.subject} / "${r.term_label}" -- ${r.unit_count} units, ${r.lesson_count} lessons (${r.reason})`);
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
