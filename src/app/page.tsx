import Image from 'next/image';
import Button from '@/components/Button';
import PhotoBanner from '@/components/PhotoBanner';
import StorySection from '@/components/StorySection';
import HighSchoolBanner from '@/components/HighSchoolBanner';
import Testimonials from '@/components/Testimonials';
import Reveal from '@/components/Reveal';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 pb-20 md:gap-28">
      {/* Immersive hero */}
      <section className="relative">
        <div className="relative h-[560px] w-full overflow-hidden md:h-[640px]">
          <Image
            src="/images/home-hero-science-experiment.jpg"
            alt="Students gathered around a science experiment at Selong Bay School"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-16 text-center md:pb-20">
            <div className="max-w-3xl rounded-2xl bg-teal-deep/40 px-6 py-7 backdrop-blur-[2px] md:px-12 md:py-9">
              <h1 className="text-balance text-white">
                <span className="font-script block text-5xl leading-none md:text-7xl">We need a</span>
                <span className="font-display block text-4xl font-semibold md:text-6xl">different kind of school</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-white/90 md:text-xl">
                A school in Lombok, built for families who want an exceptional education and time to explore.
              </p>
            </div>
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
            image={{ src: '/images/home-story-tug-of-war.jpg', alt: 'Students playing tug of war together on the beach at Selong Belanak' }}
          >
            <p>
              Selong Bay offers a flexible learning experience that combines academic excellence with curiosity, creativity,
              and real-world learning. Our online curriculum provides structure and rigour, while our beautiful Lombok campus
              brings learning to life through hands-on, inquiry-based experiences and a strong sense of community.
            </p>
            <p>
              Families can choose the learning model that suits them best: fully online, fully on campus, or a combination of
              both, and move between options as life changes, without disrupting their child&apos;s education or friendships.
            </p>
            <p>
              Our curriculum combines Cambridge International Education, the Australian National Curriculum, and the Selong
              Bay approach. In the Early Years, learning is play-based, building strong foundations through exploration and
              discovery. Through Primary and High School, students engage in inquiry-based learning that develops deep
              understanding alongside essential future-ready skills.
            </p>
            <p>
              We believe education should prepare students not only for exams, but for a rapidly changing world. Alongside
              academic achievement, we nurture creativity, critical thinking, collaboration, communication, emotional
              resilience and problem-solving: the skills young people need to thrive in an age shaped by technology, AI, and
              constant change.
            </p>
          </StorySection>
        </div>
      </Reveal>

      {/* Mission banner */}
      <Reveal>
        <PhotoBanner
          height="md"
          image={{ src: '/images/home-mission-award-ceremony.jpg', alt: 'Students receiving certificates of achievement at Selong Bay School' }}
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
                Join our on-campus or online school, from Preschool through Secondary School.
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
        <HighSchoolBanner image={{ src: '/images/home-highschool-banner-padel.jpg', alt: 'Older students playing padel on the school court' }} />
      </Reveal>

      {/* Instagram section temporarily removed - see InstagramSection.tsx to restore */}
    </div>
  );
}
