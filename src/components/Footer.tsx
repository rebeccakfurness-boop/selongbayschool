import Image from 'next/image';
import Link from 'next/link';
import { navItems, siteConfig } from '@/lib/site-content';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(siteConfig.contact.mapQuery)}&output=embed`;

  return (
    <footer className="bg-teal-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3 md:px-8">
        <div>
          <Image src="/images/logo-full.png" alt={siteConfig.name} width={378} height={299} className="h-20 w-auto" />
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/80">{siteConfig.mission}</p>
          <div className="mt-5 flex gap-3">
            <a
              href={siteConfig.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange hover:text-teal-deep"
              aria-label="Selong Bay School on Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-white/70">Contact</h3>
          <address className="mt-3 flex flex-col gap-2 text-[15px] not-italic leading-relaxed text-white/90">
            <span>{siteConfig.contact.address}</span>
            <a href={siteConfig.contact.phoneHref} className="hover:text-orange">
              {siteConfig.contact.phone}
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-orange">
              {siteConfig.contact.email}
            </a>
          </address>

          <h3 className="mt-6 font-sans text-sm font-bold uppercase tracking-wide text-white/70">Explore</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[15px] text-white/90">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-orange">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-white/70">Find us</h3>
          <div className="mt-3 overflow-hidden rounded-md border border-white/15">
            <iframe
              title="Map to Selong Bay School"
              src={mapSrc}
              className="h-48 w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-[13px] text-white/60">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
