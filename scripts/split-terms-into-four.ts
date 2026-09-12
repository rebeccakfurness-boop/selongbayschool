import { ensureSchema } from '../src/lib/db';
import { computeTermSplitPlan, applyTermSplitPlan } from '../src/lib/curriculum-term-split';

/** Restructures curriculum pacing from a 3-term to a 4-term year, for every class/subject
 * programme that currently has exactly 3 curriculum_terms rows. This is content pacing only --
 * the school's real academic calendar (academic_terms) and tuition/invoicing periods are
 * untouched, per the explicit scope agreed for this migration.
 *
 * The actual split logic lives in src/lib/curriculum-term-split.ts, shared with the admin
 * "Split into 4 terms" panel on Curriculum Plans -- see that file's header comment for the full
 * rationale (units move whole, balanced by lesson count, anything that doesn't fit the expected
 * shape is skipped and flagged for manual review).
 *
 * Usage:
 *   npm run db:split-terms-into-four              (dry run -- prints the plan, changes nothing)
 *   npm run db:split-terms-into-four -- --apply    (actually performs the split)
 */
async function main() {
  const apply = process.argv.includes('--apply');
  await ensureSchema();

  const plan = await computeTermSplitPlan();

  for (const group of plan.groups) {
    if (group.status === 'skipped') {
      console.log(`SKIP  ${group.className} / ${group.subject}: ${group.reason}`);
      continue;
    }
    console.log(`\n${group.className} / ${group.subject} -- across ${group.oldTermLabels.join(', ')}:`);
    group.buckets!.forEach((b, i) => {
      console.log(`  Term ${i + 1}: ${b.unitTitles.length} unit(s), ${b.lessonCount} lessons -- ${b.unitTitles.join(' | ')}`);
    });
  }

  if (apply) {
    const { appliedGroups } = await applyTermSplitPlan(plan);
    console.log(`\nApplied: split ${appliedGroups.length} programme(s) into 4 terms.`);
  }

  console.log(`\n${plan.plannedCount} programme(s) ${apply ? 'split into 4 terms' : 'would be split (dry run -- add --apply to actually do it)'}, ${plan.skippedCount} skipped for manual review.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
