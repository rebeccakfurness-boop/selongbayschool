import Link from 'next/link';

export default function BookingsTabs({ active }: { active: 'bookings' | 'passes' }) {
  const tabs = [
    { key: 'bookings', href: '/admin/bookings', label: 'Bookings' },
    { key: 'passes', href: '/admin/bookings/passes', label: 'Passes' },
  ] as const;

  return (
    <div className="flex gap-2">
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
