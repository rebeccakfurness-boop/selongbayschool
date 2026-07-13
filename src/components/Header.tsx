'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { headerNavItems, siteConfig } from '@/lib/site-content';

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-teal shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo-full.png"
            alt={siteConfig.name}
            width={378}
            height={299}
            priority
            className="h-12 w-auto md:h-14"
          />
          <span className="sr-only">{siteConfig.name}</span>
        </Link>

        <nav className="hidden md:block" aria-label="Primary">
          <ul className="flex flex-wrap items-center justify-end gap-0.5">
            {headerNavItems.map((item) => {
              const active = pathname === item.href || (item.children?.some((c) => c.href === pathname) ?? false);

              if (item.children) {
                return (
                  <li key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 font-sans text-[14px] font-semibold transition-colors ${
                        active ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                      <ChevronDown className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                    </Link>
                    <div className="invisible absolute left-0 top-full z-20 min-w-[200px] pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <ul className="overflow-hidden rounded-md border border-sand-line bg-paper py-1.5 shadow-soft">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`block px-4 py-2.5 font-sans text-[15px] font-semibold transition-colors ${
                                pathname === child.href ? 'bg-aqua/40 text-teal-deep' : 'text-ink hover:bg-sand/50'
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              if (item.href === '/login') {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="whitespace-nowrap rounded-full border border-orange bg-white/15 px-4 py-2 font-sans text-[14px] font-semibold text-white transition-colors hover:bg-white/25"
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`whitespace-nowrap rounded-full px-3 py-2 font-sans text-[14px] font-semibold transition-colors ${
                      active ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile primary" className="border-t border-white/10 bg-teal-deep md:hidden">
          <ul className="flex flex-col px-5 py-3">
            {headerNavItems.map((item) => {
              const active = pathname === item.href || (item.children?.some((c) => c.href === pathname) ?? false);

              if (item.children) {
                return (
                  <li key={item.href}>
                    <div className={`flex items-center justify-between rounded-lg ${active ? 'bg-white/15' : ''}`}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex-1 px-3 py-3 font-sans text-[16px] font-semibold ${active ? 'text-white' : 'text-white/90'}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOpenMobileSubmenu((v) => (v === item.href ? null : item.href))}
                        aria-expanded={openMobileSubmenu === item.href}
                        aria-label={openMobileSubmenu === item.href ? `Collapse ${item.label} submenu` : `Expand ${item.label} submenu`}
                        className="px-3 py-3 text-white/90"
                      >
                        <ChevronDown className={`transition-transform ${openMobileSubmenu === item.href ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {openMobileSubmenu === item.href && (
                      <ul className="flex flex-col gap-0.5 py-1 pl-6">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={`block rounded-lg px-3 py-2.5 font-sans text-[15px] font-semibold ${
                                pathname === child.href ? 'bg-white/15 text-white' : 'text-white/80'
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              if (item.href === '/login') {
                return (
                  <li key={item.href} className="mt-1">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg border border-orange bg-white/15 px-3 py-3 text-center font-sans text-[16px] font-semibold text-white"
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-3 font-sans text-[16px] font-semibold ${
                      active ? 'bg-white/15 text-white' : 'text-white/90'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
