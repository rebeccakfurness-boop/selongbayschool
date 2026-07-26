import type { Metadata } from 'next';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import Reveal from '@/components/Reveal';
import { activitiesGallery } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'World Schooling',
  description:
    'Selong Bay School welcomes worldschooling, homeschooling, and travelling families: see life at Selong Bay through our activities, camps, and community outings.',
  openGraph: { title: 'World Schooling - Selong Bay School' },
};

export default function WorldSchoolingPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/activities-surfboards.jpg', alt: 'Two students with surfboards giving shaka signs on the beach' }}
        card={{ script: 'Open to everyone', heading: 'World Schooling', align: 'left' }}
      />

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
