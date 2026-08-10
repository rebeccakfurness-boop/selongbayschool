import Link from 'next/link';

export default function TeachingTabs({
  active,
}: {
  active: 'lessons' | 'curriculum' | 'curriculumPlans' | 'resources' | 'schedule' | 'calendar';
}) {
  const tabs = [
    { key: 'schedule', href: '/admin/teaching/schedule', label: 'Weekly Schedule' },
    { key: 'calendar', href: '/admin/teaching/calendar', label: 'Academic Calendar' },
    { key: 'curriculumPlans', href: '/admin/teaching/curriculum-plans', label: 'Curriculum Plans' },
    { key: 'lessons', href: '/admin/teaching', label: 'Lesson Plans' },
    { key: 'curriculum', href: '/admin/teaching/curriculum', label: 'Curriculum Units' },
    { key: 'resources', href: '/admin/teaching/resources', label: 'Resources' },
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
