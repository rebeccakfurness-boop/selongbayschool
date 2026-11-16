'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import SeranganLogoutButton from '@/components/serangan/SeranganLogoutButton';

const ADMIN_ONLY_LINKS = [
  { href: '/serangan', label: 'Overview' },
  { href: '/serangan/entries', label: 'Weekly Entries' },
  { href: '/serangan/finances', label: 'Budget & Donations' },
  { href: '/serangan/campaigns', label: 'Campaigns' },
  { href: '/serangan/objectives', label: 'Objectives & Goals' },
  { href: '/serangan/reports', label: 'Reports' },
  { href: '/serangan/users', label: 'Manage Users' },
];

// 'staff' never sees budgets/statements/transactions, so no Finances or Reports link -- and no
// user management, since only 'admin' can add other logins. Gets its own "Log an Expense" link
// instead, a write-only form with no list/totals shown back.
const STAFF_LINKS = [
  { href: '/serangan', label: 'Overview' },
  { href: '/serangan/entries', label: 'Weekly Entries' },
  { href: '/serangan/campaigns', label: 'Campaigns' },
  { href: '/serangan/objectives', label: 'Objectives & Goals' },
  { href: '/serangan/log-expense', label: 'Log an Expense' },
];

/** Same collapsing-hamburger shape as AccountNav, just for the separate Serangan session. */
export default function SeranganNav({ active, role }: { active?: string; role: 'admin' | 'staff' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const LINKS = role === 'admin' ? ADMIN_ONLY_LINKS : STAFF_LINKS;

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="border-b border-black/10 bg-teal-deep">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
        <Link href="/serangan" className="font-display text-lg font-semibold text-white">
          Serangan English School
        </Link>
        <div className="hidden flex-wrap items-center gap-4 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold hover:underline ${active === l.href ? 'text-white' : 'text-white/90'}`}
            >
              {l.label}
            </Link>
          ))}
          <SeranganLogoutButton />
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-sm text-white hover:bg-white/10 lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-6 py-3 lg:hidden">
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
            <SeranganLogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
