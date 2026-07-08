'use client';

import { useState } from 'react';
import Image from 'next/image';
import Button from './Button';
import HighSchoolForm from './forms/HighSchoolForm';
import { highSchoolAnnouncement, siteConfig } from '@/lib/site-content';

export default function HighSchoolBanner({ image }: { image?: { src: string; alt: string } }) {
  const [showForm, setShowForm] = useState(false);
  const mailHref = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(highSchoolAnnouncement.mailSubject)}`;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative h-[320px] w-full md:h-[420px]">
        {image ? (
          <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0c5a60,#2a9aa1_55%,#dad0bc_100%)]">
            <span className="absolute left-5 top-4 rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
              Photo needed: surfers-sunset.jpg
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="relative z-10 mx-auto -mt-28 max-w-lg px-6 md:-mt-36">
        <div className="rounded-md bg-paper px-7 py-7 shadow-soft md:px-9 md:py-8">
          <h2 className="text-balance font-display text-2xl font-semibold text-ink md:text-3xl">
            {highSchoolAnnouncement.headline}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{highSchoolAnnouncement.body}</p>

          {!showForm ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Send me information
              </Button>
              <Button href={mailHref} variant="ghost">
                Email us instead
              </Button>
            </div>
          ) : (
            <div className="mt-5">
              <HighSchoolForm compact defaultMessage={highSchoolAnnouncement.mailSubject} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
