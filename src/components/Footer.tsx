import Image from 'next/image';
import Link from 'next/link';
import { navItems, siteConfig } from '@/lib/site-content';

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M14 13.5h2.5l1-4H14V7.5c0-1.03 0-2 2-2h1.5V2.14c-.326-.044-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.86.505 3.6 1.382 5.093L2 22l5.058-1.352A9.94 9.94 0 0 0 12 22c5.523 0 10-4.477 10-10S17.524 2 12.001 2zm0 18.05a8.02 8.02 0 0 1-4.086-1.117l-.293-.174-3.003.803.802-2.928-.19-.301A8.05 8.05 0 1 1 20.05 12a8.06 8.06 0 0 1-8.049 8.05z" />
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
          {/* Instagram link temporarily removed */}
          <div className="mt-5 flex gap-3">
            <a
              href={siteConfig.contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange hover:text-teal-deep"
              aria-label="Selong Bay School on Facebook"
            >
              <FacebookIcon />
            </a>
            <a
              href={siteConfig.contact.whatsappHref}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange hover:text-teal-deep"
              aria-label="Message Selong Bay School on WhatsApp"
            >
              <WhatsAppIcon />
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
          <ul className="mt-3 columns-2 gap-x-4 text-[15px] text-white/90">
            {navItems.map((item) => (
              <li key={item.href} className="mb-2 break-inside-avoid">
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
