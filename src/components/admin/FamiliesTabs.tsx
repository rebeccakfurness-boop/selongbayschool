import Link from 'next/link';
import type { StaffRole } from '@/lib/auth';

export default function FamiliesTabs({
  active,
  role,
}: {
  active: 'board' | 'calendar' | 'enquiries' | 'forecast';
  role: StaffRole;
}) {
  const tabs = [
    { key: 'board', href: '/admin/families', label: 'Board' },
    { key: 'calendar', href: '/admin/families/calendar', label: 'Calendar' },
    { key: 'enquiries', href: '/admin/families/enquiries', label: 'Admissions Pipeline' },
    ...(role === 'admin' ? [{ key: 'forecast', href: '/admin/families/forecast', label: 'Class Forecast' }] : []),
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
