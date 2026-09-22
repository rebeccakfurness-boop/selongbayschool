'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from '@/components/account/LogoutButton';

const LINKS = [
  { href: '/account/learning', label: 'My Children' },
  { href: '/account/online-learning', label: 'Online Learning' },
  { href: '/account/attendance', label: 'Attendance' },
  { href: '/account/bookings', label: 'My Bookings' },
  { href: '/account/library', label: 'Library' },
  { href: '/account/policies', label: 'Policies' },
  { href: '/account/feedback', label: 'Report a Concern' },
  { href: '/account/settings', label: 'Settings' },
];

/** Shared header bar for every page under /account — keeps the nav links and logout button in
 * sync across pages instead of each page carrying its own near-identical copy. `active` bolds
 * the current page's link; the brand text on the left always points back to the /account
 * overview (the portal's landing page). Below sm, the full link row no longer fits (it used to
 * just wrap onto several lines, which worked but read as a wall of text above the actual page) —
 * it collapses into a hamburger toggle that expands the same links as a stacked list instead. */
export default function AccountNav({ active }: { active?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Adjusting state during render when the tracked pathname changes, rather than in an effect --
  // this component stays mounted across route changes, so there's no remount to reset `open` for
  // free, but a plain setState-in-effect trips the cascading-render lint rule. See React's own
  // guidance on this pattern ("adjusting state when a prop changes").
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="border-b border-black/10 bg-teal-deep">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
        <Link href="/account" className="font-display text-lg font-semibold text-white">
          My Account
        </Link>
        <div className="hidden flex-wrap items-center gap-4 sm:flex">
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
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-sm text-white hover:bg-white/10 sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-6 py-3 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-sm px-2 py-2.5 text-sm font-semibold ${
                active === l.href ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 px-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
