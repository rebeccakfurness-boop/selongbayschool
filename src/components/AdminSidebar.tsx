'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { StaffRole } from '@/lib/auth';

const SECTIONS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/my-roster', label: 'My Roster' },
  { href: '/admin/resource-requests', label: 'Resource Requests' },
  { href: '/admin/families', label: 'Family Board' },
  { href: '/admin/import', label: 'Import Data', adminOnly: true },
  { href: '/admin/staff', label: 'Staff', adminOnly: true },
  { href: '/admin/teaching', label: 'Teaching' },
  { href: '/admin/online-learning', label: 'Online Learning' },
  { href: '/admin/policies', label: 'School Policies' },
  { href: '/admin/feedback', label: 'Parent Feedback', adminOnly: true },
  { href: '/admin/incidents', label: 'Incident Reports' },
  { href: '/admin/invoices', label: 'Invoices', adminOnly: true },
  { href: '/admin/budget', label: 'Budget Tracker', adminOnly: true },
  { href: '/admin/lunch-orders', label: 'Lunch Orders', adminOnly: true },
  { href: '/admin/attendance', label: 'Attendance', adminOnly: true },
  { href: '/admin/classroom', label: 'Google Classroom', adminOnly: true },
  { href: '/admin/calendar', label: 'Meeting Calendar', adminOnly: true },
  { href: '/admin/activities', label: 'Activities & Calendar', adminOnly: true },
  { href: '/admin/bookings', label: 'Bookings', adminOnly: true },
  { href: '/admin/library', label: 'Library' },
  { href: '/admin/customers', label: 'Parent Accounts', adminOnly: true },
  { href: '/admin/enrolments', label: 'Enrolments', adminOnly: true },
  { href: '/admin/enquiries', label: 'Website Enquiries', adminOnly: true },
  { href: '/admin/website-updates', label: 'Website Updates', adminOnly: true },
  { href: '/admin/settings', label: 'Settings' },
];

/** Below md, the full 25-item nav can't just sit on screen the way it does on desktop -- this
 * renders as a slim top bar with a hamburger toggle, opening the same link list as a full-height
 * slide-in drawer over a backdrop. At md and up it reverts to the original always-visible
 * left-hand column (fixed becomes relative, the translate is neutralized, the mobile-only top bar
 * and backdrop disappear). One component rather than two parallel implementations, so the section
 * list and active-link logic can't drift out of sync between breakpoints. */
export default function AdminSidebar({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // A same-page navigation (clicking a link, or the back/forward browser buttons) should close
  // the drawer. This component stays mounted across route changes (it's part of the persistent
  // layout), so there's no remount to reset `open` for free -- adjusting state during render when
  // a tracked value changes, rather than in an effect, per React's own guidance on this pattern.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const sections = SECTIONS.filter((section) => role === 'admin' || !section.adminOnly);

  // A plain startsWith would light up every section whose href is a prefix of the current path
  // at once, if one section's route ever nests under another's. Only the longest (most specific)
  // matching href wins.
  const activeHref = sections.reduce<string | null>((best, section) => {
    const matches = section.href === '/admin' ? pathname === '/admin' : (pathname ?? '').startsWith(section.href);
    if (!matches) return best;
    return !best || section.href.length > best.length ? section.href : best;
  }, null);

  return (
    <>
      <div className="flex items-center justify-between bg-teal-deep px-4 py-3 print:hidden md:hidden">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-9 w-auto" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-sm text-white hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 max-w-[85vw] flex-shrink-0 flex-col overflow-y-auto bg-teal-deep transition-transform duration-200 ease-out print:hidden md:relative md:z-auto md:w-64 md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6 md:justify-center">
          <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-14 w-auto" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-sm text-white hover:bg-white/10 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4">
          {sections.map((section) => {
            const active = section.href === activeHref;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`rounded-sm px-4 py-3 text-sm font-semibold transition-colors md:py-2.5 ${
                  active ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-sm border border-white/30 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 md:py-2"
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
