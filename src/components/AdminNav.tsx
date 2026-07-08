'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const tabs = [
    { href: '/admin', label: 'Submissions' },
    { href: '/admin/availability', label: 'Availability' },
  ];

  return (
    <div className="border-b border-black/10 bg-teal-deep">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg font-semibold text-white">Selong Bay Admin</span>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  pathname === tab.href ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
