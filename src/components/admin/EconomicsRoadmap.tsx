'use client';

import { useState } from 'react';
import { economics0455Roadmap, type RoadmapLessonPhase } from '@/lib/curriculum-generation/content/economics-0455-roadmap';

const PHASE_LABEL: Record<RoadmapLessonPhase, string> = {
  content: 'Content',
  review: 'Review',
  revision: 'Revision',
  'exam-skill': 'Exam skill',
  'past-paper': 'Past paper',
  buffer: 'Buffer',
};

const PHASE_CLASS: Record<RoadmapLessonPhase, string> = {
  content: 'bg-teal/15 text-teal-deep',
  review: 'bg-lightteal/20 text-teal-deep',
  revision: 'bg-orange/15 text-orange-deep',
  'exam-skill': 'bg-orange/20 text-orange-deep',
  'past-paper': 'bg-ink/10 text-ink-soft',
  buffer: 'bg-sand/40 text-ink-soft',
};

/** Static reference view of Tom's full 74-lesson Economics 0455 course -- sourced entirely from
 * economics-0455-roadmap.ts (transcribed from the source repo's syllabus.json/lessons.json), so it
 * renders with no database round trip. Shows what's ready to import today (lessons 1-6, authored in
 * economics-0455-tom.ts) alongside the full planned sequence for the rest of the course. */
export default function EconomicsRoadmap() {
  const [expanded, setExpanded] = useState(false);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  const { lessons, syllabusTopics } = economics0455Roadmap;
  const readyCount = lessons.filter((l) => l.materialsGenerated).length;

  return (
    <div className="rounded-md border-2 border-sand-line bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">Course roadmap · Example rollout</p>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-ink">
            {economics0455Roadmap.title} {economics0455Roadmap.code} — {economics0455Roadmap.className}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {economics0455Roadmap.examSeries} exam series · {readyCount} of {lessons.length} lessons authored and ready to
            import today, the rest planned out below.
          </p>
        </div>
        <span className="shrink-0 rounded-full border-2 border-teal-deep px-4 py-1.5 text-sm font-semibold text-teal-deep">
          {expanded ? 'Hide roadmap' : 'View roadmap'}
        </span>
      </button>

      {expanded && (
        <div className="border-t-2 border-sand-line px-5 py-5">
          <p className="text-sm text-ink-soft">
            Lessons 1-6 (syllabus 1.2 and 2.4.3-2.8) are fully authored -- definitions, worked examples, quizzes and
            flashcards -- and waiting in <code className="rounded bg-sand/40 px-1 py-0.5 text-xs">economics-0455-tom.ts</code>
            {' '}to be imported into this term once database access is available. Everything else below is the planned
            sequence: a date, syllabus reference and title exist, but the lesson content hasn&apos;t been written yet.
          </p>

          <h4 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink">Syllabus map</h4>
          <div className="mt-2 flex flex-col gap-2">
            {syllabusTopics.map((topic) => {
              const knownCount = topic.subtopics.filter((s) => s.known).length;
              const isOpen = openTopicId === topic.id;
              return (
                <div key={topic.id} className="rounded-md border border-sand-line">
                  <button
                    type="button"
                    onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                  >
                    <span className="text-sm font-semibold text-ink">
                      {topic.id}. {topic.title}
                    </span>
                    <span className="shrink-0 text-xs text-ink-soft">
                      {knownCount}/{topic.subtopics.length} already known · {isOpen ? 'Hide' : 'Show'} subtopics
                    </span>
                  </button>
                  {isOpen && (
                    <ul className="flex flex-col gap-1 border-t border-sand-line px-4 py-2.5">
                      {topic.subtopics.map((sub) => (
                        <li key={sub.id} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-ink-soft">
                            <span className="font-mono">{sub.id}</span> {sub.title}
                            {sub.note ? <span className="italic text-ink-soft/70"> — {sub.note}</span> : null}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${sub.known ? 'bg-teal/15 text-teal-deep' : 'bg-sand/40 text-ink-soft'}`}
                          >
                            {sub.known ? 'Already known' : 'To teach'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <h4 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink">Full lesson sequence</h4>
          <div className="mt-2 max-h-96 overflow-y-auto overflow-x-auto rounded-md border border-sand-line">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead className="sticky top-0 bg-cream">
                <tr>
                  <th className="border-b border-sand-line px-3 py-2 text-left font-bold text-ink">#</th>
                  <th className="border-b border-sand-line px-3 py-2 text-left font-bold text-ink">Date</th>
                  <th className="border-b border-sand-line px-3 py-2 text-left font-bold text-ink">Phase</th>
                  <th className="border-b border-sand-line px-3 py-2 text-left font-bold text-ink">Syllabus</th>
                  <th className="border-b border-sand-line px-3 py-2 text-left font-bold text-ink">Title</th>
                  <th className="border-b border-sand-line px-3 py-2 text-left font-bold text-ink">Status</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.lesson} className={lesson.materialsGenerated ? 'bg-teal/5' : undefined}>
                    <td className="border-b border-sand-line px-3 py-1.5 font-mono text-ink-soft">{lesson.lesson}</td>
                    <td className="border-b border-sand-line px-3 py-1.5 whitespace-nowrap text-ink-soft">{lesson.date}</td>
                    <td className="border-b border-sand-line px-3 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${PHASE_CLASS[lesson.phase]}`}>
                        {PHASE_LABEL[lesson.phase]}
                      </span>
                    </td>
                    <td className="border-b border-sand-line px-3 py-1.5 font-mono text-ink-soft">{lesson.syllabusRef}</td>
                    <td className="border-b border-sand-line px-3 py-1.5 text-ink">{lesson.title}</td>
                    <td className="border-b border-sand-line px-3 py-1.5 whitespace-nowrap">
                      {lesson.materialsGenerated ? (
                        <span className="font-semibold text-teal-deep">✓ Ready to import</span>
                      ) : (
                        <span className="text-ink-soft">Planned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
