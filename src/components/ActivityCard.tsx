'use client';

import { useState } from 'react';
import Image from 'next/image';
import Button from './Button';
import BookingPanel from './BookingPanel';
import { formatIDR, type Activity } from '@/lib/site-content';

export default function ActivityCard({ activity, image }: { activity: Activity; image?: { src: string; alt: string } }) {
  const [booking, setBooking] = useState(false);

  return (
    <div className="overflow-hidden rounded-md border border-black/5 bg-paper shadow-soft">
      <div className="relative h-44 w-full">
        {image ? (
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0c5a60,#41bcc2_60%,#dad0bc_100%)]">
            <span className="absolute left-3 top-3 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80">
              Photo needed: {activity.slug}.jpg
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-tight text-ink">{activity.name}</h3>
        </div>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-teal-deep">
          {activity.day}
          {activity.duration ? ` · ${activity.duration}` : ''}
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{activity.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-sans text-base font-extrabold text-ink">
            {activity.priceIDR ? formatIDR(activity.priceIDR) : activity.priceNote}
          </span>
          {activity.priceIDR && activity.priceNote && (
            <span className="text-xs font-semibold text-orange-deep">{activity.priceNote}</span>
          )}
        </div>

        {!booking ? (
          <Button variant="primary" className="mt-4 w-full" onClick={() => setBooking(true)}>
            Book Now
          </Button>
        ) : (
          <BookingPanel activitySlug={activity.slug} onClose={() => setBooking(false)} />
        )}
      </div>
    </div>
  );
}
