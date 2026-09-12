import { sql, ensureSchema } from '../src/lib/db';

/** Restructures curriculum pacing from a 3-term to a 4-term year, for every class/subject
 * programme that currently has exactly 3 curriculum_terms rows. This is content pacing only --
 * the school's real academic calendar (academic_terms) and tuition/invoicing periods are
 * untouched, per the explicit scope agreed for this migration.
 *
 * Units (curriculum_term_units) move to new term rows whole -- a unit's lessons are never split
 * across two terms, and unit_id/lesson_id never change, so every child's progress
 * (child_lesson_progress, child_lesson_online_progress), worksheet/answer submissions,
 * translations, and any occurrence_id link to the physical schedule survive untouched. Only
 * term_id (which term a unit sits under) and sort_order (renumbered within its new term) change.
 *
 * The split point is chosen by lesson count, not unit count, at the ~25/50/75% marks of the whole
 * programme's total lessons -- so each new term ends up roughly a quarter of the year's actual
 * workload, not just a quarter of however many units happen to exist. A cut only ever falls
 * between two units, never inside one.
 *
 * Any class/subject that doesn't currently have exactly 3 terms, or has fewer than 4 units total,
 * is left completely alone and flagged for manual review -- this script never guesses at a
 * pacing decision for a shape it wasn't designed for.
 *
 * Usage:
 *   npm run db:split-terms-into-four              (dry run -- prints the plan, changes nothing)
 *   npm run db:split-terms-into-four -- --apply    (actually performs the split)
 */

interface TermRow {
  id: number;
  class_name: string;
  subject: string;
  term_label: string;
  framework_label: string | null;
  exam_board: string | null;
  exam_series: string | null;
  syllabus_pdf_url: string | null;
  workbook_pdf_url: string | null;
  source_verified: boolean | null;
  source_note: string | null;
  ongoing_card: unknown;
}
interface UnitRow {
  id: number;
  term_id: number;
  sort_order: number;
  title: string;
}
interface Bucket {
  units: UnitRow[];
  lessonCount: number;
}

function termLabelNumber(label: string, fallback: number): number {
  const m = label.match(/\d+/);
  return m ? Number(m[0]) : fallback;
}

/** Splits an ordered unit list into 4 buckets, cutting only between units, at whichever unit
 * boundary lands closest to each 25/50/75% cumulative-lesson-count target -- clamped so every
 * later bucket still gets at least one unit if there are enough units to go around. */
function splitIntoFourBuckets(units: UnitRow[], lessonCountByUnit: Map<number, number>): Bucket[] {
  const cum: number[] = [];
  let running = 0;
  for (const u of units) {
    running += lessonCountByUnit.get(u.id) ?? 0;
    cum.push(running);
  }
  const total = running;
  const targets = [0.25, 0.5, 0.75].map((f) => f * total);

  const cutAfterIndex: number[] = [];
  for (const target of targets) {
    let idx = cum.findIndex((c) => c >= target);
    if (idx === -1) idx = units.length - 1;
    const minIdx = cutAfterIndex.length > 0 ? cutAfterIndex[cutAfterIndex.length - 1] + 1 : 0;
    const remainingBucketsAfterThis = 3 - cutAfterIndex.length;
    const maxIdx = units.length - 1 - remainingBucketsAfterThis;
    idx = Math.min(Math.max(idx, minIdx), Math.max(maxIdx, minIdx));
    cutAfterIndex.push(idx);
  }

  const boundaries = [-1, ...cutAfterIndex, units.length - 1];
  const buckets: Bucket[] = [];
  for (let i = 0; i < 4; i++) {
    const slice = units.slice(boundaries[i] + 1, boundaries[i + 1] + 1);
    buckets.push({ units: slice, lessonCount: slice.reduce((s, u) => s + (lessonCountByUnit.get(u.id) ?? 0), 0) });
  }
  return buckets;
}

async function main() {
  const apply = process.argv.includes('--apply');
  await ensureSchema();

  const terms = (await sql`
    SELECT id, class_name, subject, term_label, framework_label, exam_board, exam_series,
      syllabus_pdf_url, workbook_pdf_url, source_verified, source_note, ongoing_card
    FROM curriculum_terms
    ORDER BY class_name, subject, term_label
  `) as unknown as TermRow[];

  const units = (await sql`
    SELECT id, term_id, sort_order, title FROM curriculum_term_units ORDER BY term_id, sort_order, id
  `) as unknown as UnitRow[];
  const unitsByTerm = new Map<number, UnitRow[]>();
  for (const u of units) {
    (unitsByTerm.get(u.term_id) ?? unitsByTerm.set(u.term_id, []).get(u.term_id)!).push(u);
  }

  const lessonCounts = (await sql`
    SELECT unit_id, count(*)::int AS lesson_count FROM curriculum_unit_lessons GROUP BY unit_id
  `) as unknown as { unit_id: number; lesson_count: number }[];
  const lessonCountByUnit = new Map(lessonCounts.map((r) => [r.unit_id, r.lesson_count]));

  const byGroup = new Map<string, TermRow[]>();
  for (const t of terms) {
    const key = `${t.class_name}::${t.subject}`;
    (byGroup.get(key) ?? byGroup.set(key, []).get(key)!).push(t);
  }

  let planned = 0;
  let skipped = 0;

  for (const [key, groupTerms] of byGroup) {
    const [className, subject] = key.split('::');

    if (groupTerms.length !== 3) {
      console.log(`SKIP  ${className} / ${subject}: has ${groupTerms.length} term(s), expected exactly 3 -- needs manual review.`);
      skipped++;
      continue;
    }

    const ordered = [...groupTerms].sort((a, b) => termLabelNumber(a.term_label, a.id) - termLabelNumber(b.term_label, b.id));
    const orderedUnits = ordered.flatMap((t) => unitsByTerm.get(t.id) ?? []);
    const totalLessons = orderedUnits.reduce((s, u) => s + (lessonCountByUnit.get(u.id) ?? 0), 0);

    if (orderedUnits.length < 4) {
      console.log(
        `SKIP  ${className} / ${subject}: only ${orderedUnits.length} unit(s) across its 3 terms -- not enough to split into 4 without breaking a unit apart.`
      );
      skipped++;
      continue;
    }
    if (totalLessons === 0) {
      console.log(`SKIP  ${className} / ${subject}: no lessons found under its units.`);
      skipped++;
      continue;
    }

    const buckets = splitIntoFourBuckets(orderedUnits, lessonCountByUnit);
    planned++;

    console.log(`\n${className} / ${subject} -- ${orderedUnits.length} units, ${totalLessons} lessons across ${ordered.map((t) => t.term_label).join(', ')}:`);
    buckets.forEach((b, i) => {
      console.log(`  Term ${i + 1}: ${b.units.length} unit(s), ${b.lessonCount} lessons -- ${b.units.map((u) => u.title).join(' | ')}`);
    });

    if (!apply) continue;

    // Merge programme-level metadata across the 3 old terms (first non-null wins, in term order)
    // -- these describe the class/subject's programme as a whole, not any one term, but only ever
    // got set on whichever term row happened to carry it (typically Term 1).
    const meta = {
      framework_label: ordered.map((t) => t.framework_label).find((v) => v != null) ?? null,
      exam_board: ordered.map((t) => t.exam_board).find((v) => v != null) ?? null,
      exam_series: ordered.map((t) => t.exam_series).find((v) => v != null) ?? null,
      syllabus_pdf_url: ordered.map((t) => t.syllabus_pdf_url).find((v) => v != null) ?? null,
      workbook_pdf_url: ordered.map((t) => t.workbook_pdf_url).find((v) => v != null) ?? null,
      source_verified: ordered.map((t) => t.source_verified).find((v) => v != null) ?? null,
      source_note: ordered.map((t) => t.source_note).find((v) => v != null) ?? null,
      ongoing_card: ordered.map((t) => t.ongoing_card).find((v) => v != null) ?? null,
    };
    const suffix = ordered[0].term_label.replace(/^Term\s*\d+\s*/i, '').trim();

    const newTermIds: number[] = [];
    for (let i = 0; i < 4; i++) {
      const label = suffix ? `Term ${i + 1} ${suffix}` : `Term ${i + 1}`;
      const rows = (await sql`
        INSERT INTO curriculum_terms
          (class_name, subject, term_label, framework_label, exam_board, exam_series, syllabus_pdf_url, workbook_pdf_url, source_verified, source_note, ongoing_card)
        VALUES (${className}, ${subject}, ${label}, ${meta.framework_label}, ${meta.exam_board}, ${meta.exam_series}, ${meta.syllabus_pdf_url}, ${meta.workbook_pdf_url}, ${meta.source_verified}, ${meta.source_note}, ${meta.ongoing_card})
        RETURNING id
      `) as unknown as { id: number }[];
      newTermIds.push(rows[0].id);
    }

    for (let i = 0; i < 4; i++) {
      const bucketUnits = buckets[i].units;
      for (let j = 0; j < bucketUnits.length; j++) {
        await sql`UPDATE curriculum_term_units SET term_id = ${newTermIds[i]}, sort_order = ${j + 1} WHERE id = ${bucketUnits[j].id}`;
      }
    }

    const oldIds = ordered.map((t) => t.id);
    await sql`DELETE FROM curriculum_terms WHERE id = ANY(${oldIds})`;

    console.log(`  -> applied: created terms [${newTermIds.join(', ')}], removed old terms [${oldIds.join(', ')}].`);
  }

  console.log(`\n${planned} programme(s) ${apply ? 'split into 4 terms' : 'would be split (dry run -- add --apply to actually do it)'}, ${skipped} skipped for manual review.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
