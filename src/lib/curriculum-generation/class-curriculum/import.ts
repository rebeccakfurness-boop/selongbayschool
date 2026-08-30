import type { ClassCurriculumImportInput } from '@/lib/validation';
import { scheduleClassCurriculum, type ScheduledLesson } from './scheduler';
import { planFor, slugifySubject } from './plans';
import { worksheetFor } from './worksheets';
import type { GenerateCurriculumTermInput } from '../types';
import type { AuthoredTermContent } from '../static-provider';
import type { GeneratedLesson, GeneratedUnit, SyllabusTopicNode, LessonPhase } from '../types';

/** Maps the spec's five lesson phases onto this app's LessonPhase enum (content, review,
 * revision, exam_skill, past_paper, buffer -- built for secondary/IGCSE scheduling, which is why
 * neither "assessment" nor "project" has an exact match). "practice" reads closest to
 * "revision" (consolidating a skill already taught); a primary "assessment" (an end-of-unit
 * check, not an exam paper) reads closest to "exam_skill" of the remaining options; "project"
 * lessons are still new/applied content for pacing purposes, so they count the same as
 * "content" (this also matches LessonPlanningDashboard's own "syllabus covered" stat, which
 * counts phase content/review as covered). */
const PHASE_MAP: Record<ScheduledLesson['phase'], LessonPhase> = {
  content: 'content',
  practice: 'revision',
  review: 'review',
  assessment: 'exam_skill',
  project: 'content',
};

export interface TermBucket {
  termLabel: string;
  generateInput: GenerateCurriculumTermInput;
  content: AuthoredTermContent;
}

interface UnitBucket {
  key: string;
  strand: string;
  unitTitle: string;
  vocabulary?: string;
  materials?: string;
  lessons: ScheduledLesson[];
}

function objectivesTextFor(lesson: ScheduledLesson, refTitles: Map<string, string>): string {
  const parts = (lesson.codes.length > 0 ? lesson.codes : lesson.refs)
    .map((ref) => (refTitles.has(ref) ? `${ref}: ${refTitles.get(ref)}` : ref))
    .filter(Boolean);
  if (parts.length > 0) return parts.join('; ');
  return `Working towards the aims of ${lesson.unit}.`;
}

function buildLesson(lesson: ScheduledLesson, subjectSlug: string, refTitles: Map<string, string>): GeneratedLesson {
  const plan = planFor(lesson.title, lesson.phase, subjectSlug);
  const objectives = objectivesTextFor(lesson, refTitles);
  const resourcesLine = plan.resources.length > 0 ? ` Resources: ${plan.resources.join(', ')}.` : '';

  const lessonSlug = lesson.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return {
    title: lesson.title,
    objectives,
    interactiveContent: {
      steps: [
        {
          id: `explain-${lessonSlug}`,
          type: 'explanation',
          kicker: 'New idea',
          title: lesson.title,
          conceptId: lessonSlug,
          definition: objectives,
          example: plan.main[0] ?? plan.intro,
        },
        {
          id: `recap-${lessonSlug}`,
          type: 'recap_checklist',
          summaryPoints: [plan.plenary, `Look for: ${plan.look_for}`],
          homeworkItems: [],
        },
      ],
    },
    teachingScript: {
      overview: `${plan.intro}${resourcesLine}`,
      steps: [
        { stepId: `explain-${lessonSlug}`, talkingPoints: [plan.intro], timingMinutes: 10 },
        { stepId: `main-${lessonSlug}`, talkingPoints: plan.main, timingMinutes: 25 },
        { stepId: `recap-${lessonSlug}`, talkingPoints: [plan.plenary, `Look for: ${plan.look_for}`], timingMinutes: 10 },
      ],
    },
    quizQuestions: [],
    flashcards: [],
    phase: PHASE_MAP[lesson.phase],
    syllabusRef: (lesson.codes.length > 0 ? lesson.codes : lesson.refs).join(', ') || undefined,
    worksheetContent: worksheetFor(lesson.lessonNumber, lesson.title, lesson.phase, subjectSlug),
  };
}

/** Schedules a class-curriculum file against the real calendar/timetable (see scheduler.ts),
 * derives each lesson's plan and worksheet (plans.ts / worksheets.ts), and buckets the result
 * into one real academic term per curriculum_terms row -- this app's pacing model is per single
 * academic term (see computeLessonPacing), unlike the spec's own single whole-year dashboard, so
 * a 'continuous' allocation that spans multiple real terms produces one TermBucket per term it
 * actually lands lessons in (a unit whose lessons straddle a term boundary becomes two
 * GeneratedUnit entries with the same title, one per term, each holding its own portion --
 * lessons are still preserved in full, just split the same way curriculum_terms already is). */
export async function buildTermBucketsFromClassCurriculum(
  input: ClassCurriculumImportInput,
  className: string,
  options: { sourceVerified?: boolean; sourceNote?: string } = {}
): Promise<TermBucket[]> {
  const subjectSlug = slugifySubject(input.short);
  const scheduled = await scheduleClassCurriculum(input, className);

  const refTitles = new Map<string, string>();
  for (const strand of input.curriculum.strands) {
    for (const obj of strand.objectives) refTitles.set(obj.ref, obj.title);
  }

  const byTerm = new Map<string, ScheduledLesson[]>();
  for (const lesson of scheduled) {
    if (!byTerm.has(lesson.termLabel)) byTerm.set(lesson.termLabel, []);
    byTerm.get(lesson.termLabel)!.push(lesson);
  }

  const frameworkLabel = `${input.curriculum.title} (${input.curriculum.code || 'no code'}), ${input.curriculum.stage}`;
  const assessmentObjectives = input.curriculum.strands.flatMap((s) => s.objectives.map((o) => `${o.ref}: ${o.title}`));

  const buckets: TermBucket[] = [];
  for (const [termLabel, lessons] of byTerm) {
    const unitBuckets = new Map<string, UnitBucket>();
    for (const lesson of lessons) {
      const key = `${lesson.strand}::${lesson.unit}`;
      if (!unitBuckets.has(key)) {
        const authoredUnit = input.units.find((u) => u.strand === lesson.strand && u.title === lesson.unit);
        unitBuckets.set(key, {
          key,
          strand: lesson.strand,
          unitTitle: lesson.unit,
          vocabulary: authoredUnit?.vocabulary,
          materials: authoredUnit?.materials,
          lessons: [],
        });
      }
      unitBuckets.get(key)!.lessons.push(lesson);
    }

    const topicTree: SyllabusTopicNode[] = [];
    const units: Record<string, GeneratedUnit> = {};
    let unitIndex = 0;
    for (const ub of unitBuckets.values()) {
      unitIndex += 1;
      const topicId = `unit-${unitIndex}`;
      const descriptionParts = [
        ub.vocabulary ? `Vocabulary: ${ub.vocabulary}.` : null,
        ub.materials ? `Materials: ${ub.materials}.` : null,
      ].filter(Boolean) as string[];

      topicTree.push({ id: topicId, title: ub.unitTitle, description: descriptionParts.join(' ') || undefined });
      units[topicId] = {
        topicId,
        title: ub.unitTitle,
        description: descriptionParts.join(' ') || undefined,
        lessons: ub.lessons.map((l) => buildLesson(l, subjectSlug, refTitles)),
      };
    }

    const generateInput: GenerateCurriculumTermInput = {
      className,
      subject: input.short,
      termLabel,
      frameworkLabel,
      syllabusText: '',
      sourceVerified: options.sourceVerified,
      sourceNote: options.sourceNote,
    };

    const content: AuthoredTermContent = {
      parsedSyllabus: { subject: input.short, frameworkLabel, topicTree, assessmentObjectives, components: [] },
      units,
    };

    buckets.push({ termLabel, generateInput, content });
  }

  return buckets;
}
