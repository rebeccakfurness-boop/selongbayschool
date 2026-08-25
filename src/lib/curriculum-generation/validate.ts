import type { InteractiveLessonContent } from '@/lib/interactive-content-types';

/** Enforces "an explanation card must appear before any step testing that concept" -- see
 * ExplanationStep's own comment on why this is a generation-time check rather than something
 * InteractiveLessonStepper enforces at render time (it just plays steps in the order given).
 * Returns one human-readable message per violation found; empty means the ordering is fine. A
 * step referencing a conceptId with no matching explanation anywhere in the lesson is also
 * flagged, since that's the same authoring mistake either way. */
export function validateStepOrdering(content: InteractiveLessonContent): string[] {
  const problems: string[] = [];
  const explainedByIndex = new Map<string, number>();

  content.steps.forEach((step, index) => {
    if (step.type === 'explanation' && step.conceptId) {
      if (!explainedByIndex.has(step.conceptId)) explainedByIndex.set(step.conceptId, index);
    }
  });

  content.steps.forEach((step, index) => {
    const testsConceptIds = 'testsConceptIds' in step ? step.testsConceptIds ?? [] : [];
    for (const conceptId of testsConceptIds) {
      const explainedAt = explainedByIndex.get(conceptId);
      if (explainedAt === undefined) {
        problems.push(`Step "${step.id}" (${step.type}) tests concept "${conceptId}", but no explanation step defines it.`);
      } else if (explainedAt >= index) {
        problems.push(`Step "${step.id}" (${step.type}) tests concept "${conceptId}" before its explanation step appears.`);
      }
    }
  });

  return problems;
}
