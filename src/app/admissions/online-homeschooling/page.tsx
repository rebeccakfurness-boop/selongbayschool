import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import Reveal from '@/components/Reveal';
import Button from '@/components/Button';

export const metadata: Metadata = {
  title: 'Online Homeschooling',
  description:
    'Online homeschooling at Selong Bay School, run in partnership with HSPG Bali: keep learning with our teachers and curriculum from anywhere in the world.',
  openGraph: { title: 'Online Homeschooling - Selong Bay School' },
};

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[16px] leading-relaxed text-ink-soft">
      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function OnlineHomeschoolingPage() {
  return (
    <div className="flex flex-col gap-14 pb-20 md:gap-20">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/home-hero-sunset.jpg', alt: 'Sunset over the beach at Selong Belanak, Lombok' }}
        card={{ script: 'Learn from anywhere', heading: 'Online Homeschooling', align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Keep Learning With Us, Wherever You Are</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Online Homeschooling at Selong Bay School</h1>
          <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-soft">
            <p>
              For families who join us at Selong Bay and then continue travelling, our online homeschooling programme means
              learning doesn&apos;t have to stop when you leave Lombok. Your child stays connected to Selong Bay School&apos;s
              teachers and curriculum from anywhere in the world, and can rejoin the physical school in person any time
              you&apos;re back in the area.
            </p>
            <p>
              Our online homeschooling programme is run in partnership with{' '}
              <strong className="font-semibold text-ink">HSPG Bali</strong>, combining Selong Bay&apos;s teaching team and
              curriculum with HSPG Bali&apos;s homeschooling network and support structure.
            </p>
          </div>
        </div>
      </Reveal>

      <hr className="mx-auto max-w-4xl w-full border-t border-sand-line" />

      {/* How Online Homeschooling Works */}
      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Flexible, structured learning</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">How Online Homeschooling Works</h2>

          <h3 className="mt-8 font-display text-xl font-semibold text-ink">Choose your curriculum:</h3>
          <ul className="mt-4 flex flex-col gap-3">
            <Bullet>Our own unique curriculum, developed by Selong Bay teachers, or</Bullet>
            <Bullet>The Cambridge curriculum</Bullet>
          </ul>

          <h3 className="mt-8 font-display text-xl font-semibold text-ink">Regular online teaching sessions with Selong Bay teachers:</h3>
          <ul className="mt-4 flex flex-col gap-3">
            <Bullet>
              <strong className="font-semibold text-ink">Primary:</strong> one online home room session per week with a
              dedicated home room teacher
            </Bullet>
            <Bullet>
              <strong className="font-semibold text-ink">Secondary:</strong> three to six online sessions per week with
              specialist subject teachers, covering core subjects
            </Bullet>
          </ul>

          <div className="mt-6 max-w-lg overflow-hidden rounded-md border border-sand-line shadow-soft">
            <Image
              src="/images/online-homeschooling-teacher.jpg"
              alt="A Selong Bay School teacher in the classroom"
              width={1080}
              height={607}
              className="w-full"
            />
          </div>

          <h3 className="mt-8 font-display text-xl font-semibold text-ink">Support for homeschooling parents:</h3>
          <ul className="mt-4 flex flex-col gap-3">
            <Bullet>Access to an online resource library, including downloadable worksheets and learning materials</Bullet>
            <Bullet>Practical guidance on how to structure homeschooling days and stay on track with the curriculum</Bullet>
            <Bullet>
              A weekly drop-in session with teachers, available once per week per family, to ask questions, troubleshoot, and
              get support tailored to your child
            </Bullet>
          </ul>
        </div>
      </Reveal>

      <hr className="mx-auto max-w-4xl w-full border-t border-sand-line" />

      {/* Our Partnership with HSPG Bali */}
      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Working together</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Our Partnership with HSPG Bali</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
            Selong Bay School partners with HSPG Bali to support families who homeschool while travelling. This partnership
            means:
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            <Bullet>Access to HSPG Bali&apos;s wider homeschooling community and network</Bullet>
            <Bullet>
              A structure that complements Selong Bay&apos;s own curriculum and teaching, so your child&apos;s learning stays
              consistent whether they&apos;re in the classroom or on the road
            </Bullet>
            <Bullet>Continuity of support for parents navigating homeschooling logistics, wherever you are</Bullet>
          </ul>

          <div className="mt-6 max-w-lg overflow-hidden rounded-md border border-sand-line shadow-soft">
            <Image
              src="/images/online-homeschooling-staff.jpg"
              alt="Selong Bay School teachers together in the classroom"
              width={1616}
              height={909}
              className="w-full"
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Image src="/images/hspg-bali-logo.png" alt="HSPG Bali logo" width={107} height={121} className="h-14 w-auto" />
            <p className="text-sm text-ink-soft">In partnership with HSPG Bali.</p>
          </div>
        </div>
      </Reveal>

      <hr className="mx-auto max-w-4xl w-full border-t border-sand-line" />

      {/* Moving Between Online and In-Person Anytime */}
      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">No need to choose</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Moving Between Online and In-Person Anytime</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
            There&apos;s no need to choose one or the other. Families can move fluidly between:
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            <Bullet>In-person world schooling at Selong Bay when you&apos;re in Lombok, and</Bullet>
            <Bullet>Online homeschooling with our teachers when you&apos;re travelling elsewhere</Bullet>
          </ul>
          <p className="mt-6 text-[17px] leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">Come back anytime:</strong> Your child can rejoin the physical school
            in person any time you&apos;re back in the area, with no re-enrolment and no need to wait for a new term.
          </p>
        </div>
      </Reveal>

      <hr className="mx-auto max-w-4xl w-full border-t border-sand-line" />

      {/* How to Get Started */}
      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Getting started</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">How to Get Started</h2>

          <div className="mt-8 flex flex-col gap-8">
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Step 1: Get in Touch and Meet Online</h3>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                We&apos;ll arrange a short call to talk through your child&apos;s age, curriculum needs, and travel plans.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Step 2: Choose Your Curriculum</h3>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">Our own curriculum or Cambridge.</p>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Step 3: Confirm Your Online Session Schedule</h3>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                Home room sessions for primary, or subject sessions for secondary.
              </p>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-ink">Step 4: Set Up Parent Support</h3>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                Get access to online resources and book your weekly drop-in slot with teachers.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
          <p className="text-[17px] leading-relaxed text-ink-soft">
            Want to find out more about combining world schooling and online homeschooling with Selong Bay? Get in touch and
            we&apos;ll set up a time to chat.
          </p>
          <div className="mt-6">
            <Button href="/contact" variant="accent">
              Get in Touch
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
