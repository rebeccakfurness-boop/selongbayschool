import Link from 'next/link';

export default function StaffTabs({ active }: { active: 'board' | 'accounts' | 'roster' | 'attendance' }) {
  const tabs = [
    { key: 'board', href: '/admin/staff', label: 'Teacher Board' },
    { key: 'accounts', href: '/admin/staff/accounts', label: 'Accounts & Access' },
    { key: 'roster', href: '/admin/staff/roster', label: 'Duty Roster' },
    { key: 'attendance', href: '/admin/staff/attendance', label: 'Attendance' },
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
