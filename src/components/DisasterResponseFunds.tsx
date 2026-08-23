'use client';

import { useState } from 'react';
import Image from 'next/image';
import { disasterResponseFunds } from '@/lib/site-content';
import { PlaceholderImage } from '@/components/PlaceholderBox';

export default function DisasterResponseFunds() {
  const [expandedFund, setExpandedFund] = useState<string | null>(null);

  return (
    <div className="mt-8 flex flex-col gap-5">
      {disasterResponseFunds.map((fund) => {
        const isOpen = expandedFund === fund.slug;

        return (
          <div
            key={fund.slug}
            className="overflow-hidden rounded-lg border-2 border-orange-deep/30 bg-orange/10 shadow-soft transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setExpandedFund(isOpen ? null : fund.slug)}
              className="group flex w-full flex-col gap-4 px-6 py-5 text-left transition-colors hover:bg-orange/15 sm:flex-row sm:items-center sm:justify-between md:px-10"
              aria-expanded={isOpen}
            >
              <div>
                <h3 className="font-display text-xl font-semibold text-ink md:text-2xl">{fund.name}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{fund.summary}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-orange-deep px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(203,92,15,0.6)] transition-transform duration-150 group-hover:-translate-y-0.5 sm:self-auto">
                {isOpen ? 'Show less' : 'Read more & donate'}
                <svg
                  viewBox="0 0 20 20"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M5 7.5 10 12.5 15 7.5" />
                </svg>
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

                {fund.shareableImage && (
                  <div className="mt-6 flex flex-col items-start gap-4 rounded-md border border-teal/30 bg-aqua/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-sm border border-sand-line shadow-soft">
                        <Image src={fund.shareableImage.src} alt="" fill sizes="76px" className="object-cover" />
                      </div>
                      <p className="text-[15px] leading-snug text-ink-soft">
                        Help spread the word: download this image and share it on social media or with friends and family.
                      </p>
                    </div>
                    <a
                      href={fund.shareableImage.src}
                      download={fund.shareableImage.downloadName}
                      className="inline-flex shrink-0 items-start gap-2 self-stretch justify-center rounded-full bg-teal px-6 py-3.5 text-center font-sans text-sm font-extrabold leading-snug text-white shadow-[0_10px_24px_-10px_rgba(0,124,131,0.55)] transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-teal-deep sm:items-center sm:self-auto sm:text-[15.5px]"
                    >
                      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 sm:mt-0">
                        <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16.5h12" />
                      </svg>
                      Download Shareable Image to Spread Awareness
                    </a>
                  </div>
                )}

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
