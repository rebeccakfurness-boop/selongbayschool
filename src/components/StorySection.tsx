import Image from 'next/image';
import type { ReactNode } from 'react';

export interface StorySectionImage {
  src: string;
  alt: string;
}

export default function StorySection({
  eyebrowScript,
  heading,
  children,
  image,
  placeholderName,
  reverse = false,
}: {
  eyebrowScript: string;
  heading: string;
  children: ReactNode;
  image?: StorySectionImage;
  placeholderName?: string;
  reverse?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/5 bg-paper shadow-soft">
      <div className={`grid md:grid-cols-2 ${reverse ? 'md:[direction:rtl]' : ''}`}>
        <div className="relative h-[260px] md:h-auto md:[direction:ltr]">
          {image ? (
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(200deg,rgba(23,40,43,0.05),rgba(23,40,43,0.35)),linear-gradient(135deg,#16575c,#3aa6ac_45%,#aafdfa_100%)]">
              {placeholderName && (
                <span className="absolute left-5 top-4 rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
                  Photo needed: {placeholderName}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center px-8 py-10 md:px-12 md:py-12 md:[direction:ltr]">
          <p className="mb-1 font-script text-2xl text-orange-deep md:text-3xl">{eyebrowScript}</p>
          <h3 className="mb-4 max-w-[20ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
            {heading}
          </h3>
          <div className="max-w-prose space-y-4 text-[17px] leading-relaxed text-ink-soft">{children}</div>
        </div>
      </div>
    </div>
  );
}
