import Link from 'next/link';

/** Worksheets, Curriculum Plans, Lesson Plans and Curriculum Units are archived here: still real,
 * working pages (nothing about them was removed), just no longer linked from this tab bar so the
 * four most-used pages stay easy to find. active still accepts their keys so those pages
 * themselves don't need to change -- they just render this bar with nothing highlighted. */
export default function TeachingTabs({
  active,
}: {
  active: 'home' | 'lessons' | 'curriculum' | 'curriculumPlans' | 'lessonPlanning' | 'resources' | 'schedule' | 'calendar' | 'worksheets';
}) {
  const tabs = [
    { key: 'schedule', href: '/admin/teaching/schedule', label: 'Weekly Schedule' },
    { key: 'calendar', href: '/admin/teaching/calendar', label: 'Academic Calendar' },
    { key: 'resources', href: '/admin/teaching/resources', label: 'Resources' },
    { key: 'lessonPlanning', href: '/admin/teaching/lesson-planning', label: 'Lesson Planning & Preparation' },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            active === tab.key ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
