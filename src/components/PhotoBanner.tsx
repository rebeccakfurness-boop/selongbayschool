import Image from 'next/image';

type CardAlign = 'left' | 'right' | 'center';

export interface PhotoBannerImage {
  src: string;
  alt: string;
  focalPosition?: 'center' | 'top' | 'bottom';
}

export interface PhotoBannerCard {
  script?: string;
  heading: string;
  body?: string;
  align?: CardAlign;
}

const heightClasses = {
  sm: 'h-[220px] md:h-[280px]',
  md: 'h-[320px] md:h-[420px]',
  lg: 'h-[420px] md:h-[560px]',
};

const alignClasses: Record<CardAlign, string> = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center',
};

/**
 * The signature full-bleed photo banner + overlapping sand card, carried over
 * from the previous site. Falls back to a teal/sand gradient placeholder
 * (with the expected filename shown) when no real photo has been supplied yet.
 */
export default function PhotoBanner({
  image,
  card,
  height = 'md',
  placeholderName,
}: {
  image?: PhotoBannerImage;
  card?: PhotoBannerCard;
  height?: 'sm' | 'md' | 'lg';
  placeholderName?: string;
}) {
  return (
    <div className="w-full">
      <div className={`relative w-full overflow-hidden ${heightClasses[height]}`}>
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: image.focalPosition ? `center ${image.focalPosition}` : 'center' }}
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#0c5a60,#2a9aa1_55%,#dad0bc_100%)]">
            {placeholderName && (
              <span className="absolute left-5 top-4 rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
                Photo needed: {placeholderName}
              </span>
            )}
          </div>
        )}
      </div>

      {card && (
        <div className={`relative z-10 -mt-16 flex px-6 md:-mt-20 md:px-10 ${alignClasses[card.align ?? 'right']}`}>
          <div className="max-w-md rounded-md border border-sand-line bg-sand px-7 py-6 shadow-soft md:px-8 md:py-7">
            {card.script && (
              <p className="mb-0.5 font-script text-2xl leading-none text-teal-deep md:text-3xl">{card.script}</p>
            )}
            <h3 className="text-balance font-display text-2xl font-semibold leading-tight text-ink md:text-3xl">
              {card.heading}
            </h3>
            {card.body && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{card.body}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
