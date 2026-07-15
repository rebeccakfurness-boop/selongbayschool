'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const SECTIONS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/activities', label: 'Activities & Calendar' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/customers', label: 'Parent Accounts' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/website-updates', label: 'Website Updates' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="flex h-full w-64 flex-shrink-0 flex-col bg-teal-deep">
      <div className="flex justify-center px-6 py-6">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-14 w-auto" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4">
        {SECTIONS.map((section) => {
          const active = section.href === '/admin' ? pathname === '/admin' : pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors ${
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
          className="w-full rounded-sm border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
