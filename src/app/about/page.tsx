import type { Metadata } from 'next';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import StorySection from '@/components/StorySection';
import OurValues from '@/components/OurValues';
import Reveal from '@/components/Reveal';
import { PlaceholderImage } from '@/components/PlaceholderBox';
import { campusFacts, foundingFamilies, teachers } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story, values, campus, and teachers behind Selong Bay School: a non-profit school for world-schooling and local families in Lombok.',
  openGraph: {
    title: 'About - Selong Bay School',
    images: [{ url: '/images/home-hero-sunset.jpg', width: 2400, height: 1800, alt: 'Sunset over the beach at Selong Belanak, Lombok' }],
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/home-hero-sunset.jpg', alt: 'Sunset over the beach at Selong Belanak, Lombok' }}
        card={{ script: 'Our story', heading: 'A different kind of school', align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <StorySection
            eyebrowScript="Who we are"
            heading="Built by families, for families"
            image={{ src: '/images/about-community.jpg', alt: 'Selong Bay School students and families gathered on the beach after a surf session' }}
          >
            <p>
              Selong Bay School began with families who came to South Lombok for a season and stayed for the community.
              Today it operates under Yayasan Selong Bay Intercultural Sekolah, a registered non-profit foundation. We are
              not for profit, we are for the children and the community of South Lombok.
            </p>
            <p>
              Every fee is reinvested into the school&apos;s development: scholarships, community programmes, and training
              for local teachers and staff.
            </p>
          </StorySection>
        </div>
      </Reveal>

      <Reveal>
        <OurValues />
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our campus</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">A classroom that includes the ocean</h2>
          <div className="mt-6 overflow-hidden rounded-md border border-sand-line shadow-soft">
            <Image
              src="/images/home-story-beach-tree.jpg"
              alt="Students climbing a beach tree overlooking the ocean at Selong Belanak"
              width={2000}
              height={1335}
              className="w-full"
            />
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {campusFacts.map((fact) => (
              <li key={fact} className="flex items-start gap-3 rounded-md border border-sand-line bg-paper px-5 py-4 text-[15px] text-ink-soft">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div id="teachers" className="mx-auto max-w-6xl scroll-mt-24 px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our teachers</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">The people your child learns with</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {teachers.map((teacher) => (
              <div key={teacher.name} className="rounded-md border border-sand-line bg-paper p-6">
                {teacher.image ? (
                  <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-sm">
                    <Image src={teacher.image.src} alt={teacher.image.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  </div>
                ) : (
                  <PlaceholderImage label={`Photo: ${teacher.name}`} className="mb-4 aspect-square h-auto" />
                )}
                <h3 className="font-display text-lg font-semibold text-ink">{teacher.name}</h3>
                <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-teal-deep">{teacher.role}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{teacher.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our community</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Founding families who call Selong Bay Home</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {foundingFamilies.map((family) => (
              <div key={family.name} className="overflow-hidden rounded-md border border-sand-line bg-aqua/30">
                {family.image && (
                  <div className="relative aspect-[4/5] w-full">
                    <Image src={family.image.src} alt={family.image.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover object-top" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold text-ink">{family.name}</h3>
                  <p className="mt-1 text-[15px] text-ink-soft">{family.detail}</p>
                  {family.blurb && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{family.blurb}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
