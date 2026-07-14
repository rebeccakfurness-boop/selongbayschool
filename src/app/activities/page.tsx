import type { Metadata } from 'next';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import ActivityCard from '@/components/ActivityCard';
import Reveal from '@/components/Reveal';
import { ensureSchema, sql } from '@/lib/db';
import { afternoonClubs, activitiesGallery, type Activity } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Activities and WorldSchooling',
  description:
    'Surfing, gymnastics, dance, scouting, and adventure camps at Selong Bay School: open to the whole community, not just enrolled students. Book a slot online.',
  openGraph: {
    title: 'Activities and WorldSchooling - Selong Bay School',
    images: [{ url: '/images/activities-surfboards.jpg', width: 1150, height: 964, alt: 'Students with surfboards at Selong Belanak Beach' }],
  },
};

interface ActivityRow {
  slug: string;
  name: string;
  day: string | null;
  duration: string | null;
  price_idr: number | null;
  price_note: string | null;
  description: string;
  age_group: string | null;
}

async function getActivities(): Promise<Activity[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT slug, name, day, duration, price_idr, price_note, description, age_group
    FROM activities
    WHERE is_active = true
    ORDER BY id ASC
  `) as unknown as ActivityRow[];
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    day: row.day ?? '',
    duration: row.duration,
    priceIDR: row.price_idr,
    priceNote: row.price_note ?? undefined,
    description: row.description,
    ageGroup: row.age_group ?? '',
  }));
}

const activityImages: Record<string, { src: string; alt: string }> = {
  'surfing-selong-belanak': {
    src: '/images/home-beach-walk.jpg',
    alt: 'Two students walking the beach carrying a surfboard at Selong Belanak',
  },
  'gymnastics-free-swim': {
    src: '/images/activity-gymnastics-v3.jpg',
    alt: 'A student practising a jump on gym mats at Selong Bay School',
  },
  'hip-hop-dance-ninja-warrior': {
    src: '/images/activity-ninja-hiphop.jpg',
    alt: 'Students balancing across an obstacle course with a teacher at Selong Bay School',
  },
  'art-music-bahasa': {
    src: '/images/activity-art-music.jpg',
    alt: 'Students working together on a craft activity at Selong Bay School',
  },
  'scouts-survival-challenge': {
    src: '/images/activity-scouts.jpg',
    alt: 'Students exploring tide pools together at Selong Belanak',
  },
  'school-tour': {
    src: '/images/activity-school-tour-v2.jpg',
    alt: 'Aerial view of the Selong Bay School campus and padel court',
  },
  'adventure-camp-2026-per-day': {
    src: '/images/activity-adventure-camp.jpg',
    alt: 'A student skateboarding at Selong Bay School',
  },
  'adventure-camp-2026-full-week': {
    src: '/images/home-story-beach-tree.jpg',
    alt: 'Students climbing a beach tree overlooking the ocean at Selong Belanak',
  },
};

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/activities-surfboards.jpg', alt: 'Two students with surfboards giving shaka signs on the beach' }}
        card={{ script: 'Open to everyone', heading: 'Activities and WorldSchooling', align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h1 className="text-balance font-display text-2xl font-semibold text-teal-deep md:text-3xl">
            You don&apos;t need to be a Selong Bay student to join us: all activities are open to the wider community.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
            Whether your family is visiting South Lombok for a week or living here full-time, our afternoon activities and
            camps welcome kids of all backgrounds. Pick an activity below and book a real available slot.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Book an activity</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <ActivityCard key={activity.slug} activity={activity} image={activityImages[activity.slug]} />
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Ongoing afternoon clubs</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            Alongside our bookable sessions above, enrolled students take part in a rotating afternoon clubs programme:
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {afternoonClubs.map((club) => (
              <span key={club} className="rounded-full bg-sand px-4 py-1.5 text-sm font-semibold text-ink">
                {club}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Life at Selong Bay</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            A few more moments from our activities, camps, and community outings.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activitiesGallery.map((photo) => (
              <div key={photo.src} className="relative aspect-square w-full overflow-hidden rounded-md border border-sand-line shadow-soft">
                <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
