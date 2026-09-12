import Link from 'next/link';

const TABS = [
  { href: '/admin/online-learning', label: 'Overview' },
  { href: '/admin/online-learning/answers', label: 'Answers to Review' },
  { href: '/admin/online-learning/worksheets', label: 'Worksheets to Mark' },
];

export default function OnlineLearningSubNav({ active }: { active: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            active === tab.href ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
