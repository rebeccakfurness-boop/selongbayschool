import Link from 'next/link';

const TABS = [
  { href: '/admin/library', label: 'Catalogue' },
  { href: '/admin/library/loans', label: 'Loans' },
  { href: '/admin/library/memberships', label: 'Memberships', adminOnly: true },
  { href: '/admin/library/discount-codes', label: 'Discount Codes', adminOnly: true },
];

export default function LibrarySubNav({ active, isAdmin }: { active: string; isAdmin: boolean }) {
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
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
