import { sql } from './db';

/** Shared by scripts/split-terms-into-four.ts (terminal, dry-run/--apply) and the admin "Split
 * into 4 terms" panel on Curriculum Plans (browser button, since this session's own environment
 * has no database credentials to run the script directly) -- one place for the split logic so the
 * two never drift. See the script's own header comment for the full rationale: units move whole
 * (never split mid-unit), balanced by lesson count, and only class/subjects with exactly 3 terms
 * and at least 4 units are touched -- everything else is left alone and flagged for review. */

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

export interface TermSplitGroupPlan {
  className: string;
  subject: string;
  status: 'planned' | 'skipped';
  reason?: string;
  oldTermLabels: string[];
  buckets?: { unitTitles: string[]; lessonCount: number }[];
  /** Only present internally (never serialized to the client) -- kept on the plan object so apply
   * can act on exactly what was previewed without re-querying and risking drift. */
  _internal?: { ordered: TermRow[]; buckets: Bucket[] };
}

export interface TermSplitPlan {
  groups: TermSplitGroupPlan[];
  plannedCount: number;
  skippedCount: number;
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

/** Read-only -- computes exactly what would change, for every class/subject, without writing
 * anything. Safe to call as often as needed for a preview. */
export async function computeTermSplitPlan(): Promise<TermSplitPlan> {
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

  const groups: TermSplitGroupPlan[] = [];
  for (const [, groupTerms] of byGroup) {
    const className = groupTerms[0].class_name;
    const subject = groupTerms[0].subject;
    const oldTermLabels = groupTerms.map((t) => t.term_label);

    if (groupTerms.length !== 3) {
      groups.push({ className, subject, status: 'skipped', reason: `Has ${groupTerms.length} term(s), expected exactly 3.`, oldTermLabels });
      continue;
    }

    const ordered = [...groupTerms].sort((a, b) => termLabelNumber(a.term_label, a.id) - termLabelNumber(b.term_label, b.id));
    const orderedUnits = ordered.flatMap((t) => unitsByTerm.get(t.id) ?? []);
    const totalLessons = orderedUnits.reduce((s, u) => s + (lessonCountByUnit.get(u.id) ?? 0), 0);

    if (orderedUnits.length < 4) {
      groups.push({
        className,
        subject,
        status: 'skipped',
        reason: `Only ${orderedUnits.length} unit(s) across its 3 terms -- not enough to split into 4 without breaking a unit apart.`,
        oldTermLabels,
      });
      continue;
    }
    if (totalLessons === 0) {
      groups.push({ className, subject, status: 'skipped', reason: 'No lessons found under its units.', oldTermLabels });
      continue;
    }

    const buckets = splitIntoFourBuckets(orderedUnits, lessonCountByUnit);
    groups.push({
      className,
      subject,
      status: 'planned',
      oldTermLabels,
      buckets: buckets.map((b) => ({ unitTitles: b.units.map((u) => u.title), lessonCount: b.lessonCount })),
      _internal: { ordered, buckets },
    });
  }

  groups.sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject));
  return {
    groups,
    plannedCount: groups.filter((g) => g.status === 'planned').length,
    skippedCount: groups.filter((g) => g.status === 'skipped').length,
  };
}

/** Strips _internal before a plan is sent to the browser -- it's only there so applyTermSplitPlan
 * can act on exactly what was computed without a second query. */
export function serializableTermSplitPlan(plan: TermSplitPlan): TermSplitPlan {
  return { ...plan, groups: plan.groups.map(({ _internal, ...rest }) => rest) };
}

/** Performs the writes for every 'planned' group in the given plan (call computeTermSplitPlan()
 * immediately beforehand -- this trusts the plan's _internal data rather than re-deriving it, so
 * don't hold a plan across an unrelated delay). Returns which groups were actually applied. */
export async function applyTermSplitPlan(plan: TermSplitPlan): Promise<{ appliedGroups: { className: string; subject: string }[] }> {
  const appliedGroups: { className: string; subject: string }[] = [];

  for (const group of plan.groups) {
    if (group.status !== 'planned' || !group._internal) continue;
    const { ordered, buckets } = group._internal;

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
        VALUES (${group.className}, ${group.subject}, ${label}, ${meta.framework_label}, ${meta.exam_board}, ${meta.exam_series}, ${meta.syllabus_pdf_url}, ${meta.workbook_pdf_url}, ${meta.source_verified}, ${meta.source_note}, ${meta.ongoing_card})
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

    appliedGroups.push({ className: group.className, subject: group.subject });
  }

  return { appliedGroups };
}
