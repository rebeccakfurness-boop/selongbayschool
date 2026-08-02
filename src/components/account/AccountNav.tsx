import Link from 'next/link';
import LogoutButton from '@/components/account/LogoutButton';

const LINKS = [
  { href: '/account/learning', label: 'My Children' },
  { href: '/account/attendance', label: 'Attendance' },
  { href: '/account/bookings', label: 'My Bookings' },
  { href: '/account/settings', label: 'Settings' },
];

/** Shared header bar for every page under /account — keeps the nav links and logout button in
 * sync across pages instead of each page carrying its own near-identical copy. `active` bolds
 * the current page's link; the brand text on the left always points back to the /account
 * overview (the portal's landing page). */
export default function AccountNav({ active }: { active?: string }) {
  return (
    <div className="border-b border-black/10 bg-teal-deep">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/account" className="font-display text-lg font-semibold text-white">
          My Account
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold hover:underline ${active === l.href ? 'text-white' : 'text-white/90'}`}
            >
              {l.label}
            </Link>
          ))}
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
