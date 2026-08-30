import Link from 'next/link';
import TeachingTabs from '@/components/admin/TeachingTabs';

export const dynamic = 'force-dynamic';

const PRIMARY_LINKS = [
  {
    href: '/admin/teaching/schedule',
    label: 'Weekly Schedule',
    description: 'The recurring weekly timetable, shown as the main screen on the parent and student portals.',
  },
  {
    href: '/admin/teaching/calendar',
    label: 'Academic Calendar',
    description: 'Term dates and holidays: the calendar the Weekly Schedule generates real, dated sessions against.',
  },
  {
    href: '/admin/teaching/resources',
    label: 'Resources',
    description: 'Downloadable resources for the parent and student portals.',
  },
  {
    href: '/admin/teaching/lesson-planning',
    label: 'Lesson Planning & Preparation',
    description: "Every year level's teaching programmes: next lesson, pacing, and the syllabus map.",
  },
] as const;

const MORE_LINKS = [
  {
    href: '/admin/teaching/lessons',
    label: 'Lesson Plans',
    description: 'Simple week-by-week lesson plan notes that feed the portals’ "upcoming lessons" view.',
  },
  {
    href: '/admin/teaching/worksheets',
    label: 'Worksheets',
    description: "Upload, mark, and review post-lesson worksheets; marks feed each student's gradebook.",
  },
  {
    href: '/admin/teaching/curriculum-plans',
    label: 'Curriculum Plans',
    description: 'The full list of every class and subject’s programme, across the whole school.',
  },
  {
    href: '/admin/teaching/curriculum',
    label: 'Curriculum Units',
    description: 'The current curriculum unit per class, shown on the parent portal.',
  },
] as const;

export default function TeachingHomePage() {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">Pick where you want to go.</p>
        </div>
        <TeachingTabs active="home" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PRIMARY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-colors hover:border-teal"
          >
            <h2 className="font-display text-lg font-semibold text-teal-deep">{link.label}</h2>
            <p className="mt-2 text-sm text-ink-soft">{link.description}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-wide text-ink-soft">More tools</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MORE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-dashed border-sand-line bg-paper/60 p-4 transition-colors hover:border-teal"
          >
            <h3 className="font-display text-sm font-semibold text-ink">{link.label}</h3>
            <p className="mt-1 text-xs text-ink-soft">{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
