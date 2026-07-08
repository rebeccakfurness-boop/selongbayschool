import Image from 'next/image';
import Button from '@/components/Button';
import PhotoBanner from '@/components/PhotoBanner';
import StorySection from '@/components/StorySection';
import HighSchoolBanner from '@/components/HighSchoolBanner';
import InstagramSection from '@/components/InstagramSection';
import Testimonials from '@/components/Testimonials';
import Reveal from '@/components/Reveal';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 pb-20 md:gap-28">
      {/* Immersive hero */}
      <section className="relative">
        <div className="relative h-[560px] w-full overflow-hidden md:h-[640px]">
          <Image
            src="/images/home-hero-sunset.jpg"
            alt="Sunset over the beach at Selong Belanak, Lombok"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-16 text-center md:pb-20">
            <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold text-white drop-shadow-sm md:text-6xl">
              Where curious minds grow alongside the ocean
            </h1>
            <p className="mt-4 max-w-xl text-balance text-lg text-white/90 md:text-xl">
              A hybrid on-campus and online school in Lombok, built for families who want an exceptional education and time to explore.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/contact" variant="accent">
                Book a Tour
              </Button>
              <Button href="/about" variant="ghost" className="!border-white !text-white hover:!bg-white hover:!text-teal-deep">
                Discover Our Approach
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy story section */}
      <Reveal>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <StorySection
            eyebrowScript="Best of both worlds"
            heading="Every landscape becomes a classroom"
            image={{ src: '/images/home-beach-walk.jpg', alt: 'Two students walking the beach carrying a surfboard at Selong Belanak' }}
          >
            <p>
              Selong Bay blends structure and academic rigour through our online curriculum with connection, socialisation, and
              hands-on learning on our beautiful Lombok campus. Families can attend fully online, fully on-site, or move between
              the two as life demands, without disrupting learning or friendships.
            </p>
            <p>
              Our curriculum blends Cambridge International Education with the Australian National Curriculum and our own
              Selong Bay approach: play-based in the Early Years, inquiry-based through Primary, with Bahasa Indonesia and
              Religious Studies woven in as required by Indonesian regulation.
            </p>
          </StorySection>
        </div>
      </Reveal>

      {/* Mission banner */}
      <Reveal>
        <PhotoBanner
          height="md"
          placeholderName="students-project-time.jpg"
          card={{
            script: 'Whilst giving families time to explore',
            heading: 'World leading education for a sustainable future',
            align: 'right',
          }}
        />
      </Reveal>

      {/* Equal-weight CTA pair: Enrol / Book an Activity */}
      <Reveal>
        <div className="mx-auto max-w-5xl px-6 text-center md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Two ways to join us</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Whichever brings you to Selong Bay</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-4 rounded-lg border border-sand-line bg-paper p-8 shadow-soft">
              <h3 className="font-display text-xl font-semibold text-ink">Enrol full-time</h3>
              <p className="text-[15px] text-ink-soft">
                Join our on-campus or online school, from Early Years through High School.
              </p>
              <Button href="/admissions" variant="primary" fullWidth>
                Enrol at Selong Bay School
              </Button>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-lg border border-sand-line bg-paper p-8 shadow-soft">
              <h3 className="font-display text-xl font-semibold text-ink">Just visiting or living locally?</h3>
              <p className="text-[15px] text-ink-soft">
                You don&apos;t need to be a Selong Bay student: our activities and camps are open to the whole community.
              </p>
              <Button href="/activities" variant="accent" fullWidth>
                Book an Activity
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Testimonials */}
      <Reveal>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center">
            <p className="font-script text-3xl text-orange-deep md:text-4xl">Our community</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">What Selong Bay families say</h2>
          </div>
          <div className="mt-8">
            <Testimonials />
          </div>
        </div>
      </Reveal>

      {/* High School announcement */}
      <Reveal>
        <HighSchoolBanner />
      </Reveal>

      {/* Instagram */}
      <Reveal>
        <InstagramSection />
      </Reveal>
    </div>
  );
}
