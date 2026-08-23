'use client';

import { useState } from 'react';
import Image from 'next/image';
import { disasterResponseFunds } from '@/lib/site-content';
import { PlaceholderImage } from '@/components/PlaceholderBox';

export default function DisasterResponseFunds() {
  const [expandedFund, setExpandedFund] = useState<string | null>(disasterResponseFunds[0]?.slug ?? null);

  return (
    <div className="mt-8 flex flex-col gap-5">
      {disasterResponseFunds.map((fund) => {
        const isOpen = expandedFund === fund.slug;

        return (
          <div key={fund.slug} className="overflow-hidden rounded-lg border-2 border-orange-deep/30 bg-orange/10 shadow-soft">
            <button
              type="button"
              onClick={() => setExpandedFund(isOpen ? null : fund.slug)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-10"
              aria-expanded={isOpen}
            >
              <div>
                <h3 className="font-display text-xl font-semibold text-ink md:text-2xl">{fund.name}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{fund.summary}</p>
              </div>
              <span className="shrink-0 text-2xl font-bold text-orange-deep" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-orange-deep/20 px-6 pb-6 pt-6 md:px-10 md:pb-10">
                <div className="grid gap-4 sm:grid-cols-2">
                  {fund.photos && fund.photos.length > 0
                    ? fund.photos.map((photo) => (
                        <div key={photo.src} className="relative h-48 w-full overflow-hidden rounded-md">
                          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                        </div>
                      ))
                    : [1, 2].map((n) => <PlaceholderImage key={n} label="Photo coming soon" className="h-48" />)}
                </div>

                <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink-soft">
                  {fund.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {[fund.domesticBank, fund.internationalBank].map((bank) => (
                    <div key={bank.label} className="rounded-md border border-sand-line bg-paper p-5">
                      <h4 className="font-display text-base font-semibold text-teal-deep">{bank.label}</h4>
                      <div className="mt-3 flex flex-col gap-2.5">
                        {bank.rows.map((row) => (
                          <div key={row.label}>
                            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{row.label}</p>
                            <p className="text-[15px] text-ink">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm text-ink-soft">
                  Questions about this fund?{' '}
                  <a href="/contact" className="font-semibold text-teal-deep underline">
                    Contact us
                  </a>
                  . Thank you for standing with the {fund.name} community.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
