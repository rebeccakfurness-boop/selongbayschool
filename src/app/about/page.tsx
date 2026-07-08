import type { Metadata } from 'next';
import PhotoBanner from '@/components/PhotoBanner';
import StorySection from '@/components/StorySection';
import Reveal from '@/components/Reveal';
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
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our campus</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">A classroom that includes the ocean</h2>
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
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our teachers</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">The people your child learns with</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {teachers.map((teacher) => (
              <div key={teacher.name} className="rounded-md border border-sand-line bg-paper p-6">
                <div className="mb-4 h-40 w-full rounded-sm bg-[linear-gradient(135deg,#0c5a60,#41bcc2_60%,#dad0bc_100%)]" aria-hidden="true" />
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
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Families who call Selong Bay home</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {foundingFamilies.map((family) => (
              <div key={family.name} className="rounded-md border border-sand-line bg-aqua/30 p-6">
                <h3 className="font-display text-lg font-semibold text-ink">{family.name}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{family.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
