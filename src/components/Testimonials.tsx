'use client';

import Image from 'next/image';
import { useState } from 'react';
import { testimonials } from '@/lib/site-content';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const testimonial = testimonials[index];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="rounded-md border border-sand-line bg-paper px-8 py-10 shadow-soft transition-opacity duration-300">
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
        <div className="mt-5 flex justify-center gap-2">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show testimonial from ${t.name}`}
              aria-current={i === index}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${i === index ? 'bg-teal' : 'bg-sand-line hover:bg-teal/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
