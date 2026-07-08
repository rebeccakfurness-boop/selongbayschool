'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { testimonials } from '@/lib/site-content';

const SWIPE_THRESHOLD = 50;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const testimonial = testimonials[index];
  const touchStartX = useRef<number | null>(null);

  const goTo = (i: number) => setIndex((i + testimonials.length) % testimonials.length);
  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) {
      goPrev();
    } else if (delta < -SWIPE_THRESHOLD) {
      goNext();
    }
    touchStartX.current = null;
  };

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="relative">
        {testimonials.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Show previous testimonial"
            className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sand-line bg-paper p-2.5 text-teal-deep shadow-soft transition-colors hover:bg-sand sm:-left-5 sm:flex md:-left-14"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="touch-pan-y select-none rounded-md border border-sand-line bg-paper px-8 py-10 shadow-soft transition-opacity duration-300"
        >
          {testimonial.image && (
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-sand-line">
              <Image src={testimonial.image.src} alt={testimonial.image.alt} fill sizes="80px" className="object-cover" />
            </div>
          )}
          <p className="font-script text-3xl leading-tight text-orange-deep">&ldquo;</p>
          <p className="text-balance font-display text-xl font-medium leading-snug text-ink md:text-2xl">
            {testimonial.quote}
          </p>
          <p className="mt-5 text-sm font-bold uppercase tracking-wide text-teal-deep">{testimonial.name}</p>
          <p className="text-sm text-ink-soft">{testimonial.detail}</p>
        </div>

        {testimonials.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Show next testimonial"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-sand-line bg-paper p-2.5 text-teal-deep shadow-soft transition-colors hover:bg-sand sm:-right-5 sm:flex md:-right-14"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {testimonials.length > 1 && (
        <>
          <p className="mt-3 text-xs text-ink-soft sm:hidden">Swipe to see more &middot; {index + 1} of {testimonials.length}</p>
          <div className="mt-5 flex justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show testimonial from ${t.name}`}
                aria-current={i === index}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${i === index ? 'bg-teal' : 'bg-sand-line hover:bg-teal/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
