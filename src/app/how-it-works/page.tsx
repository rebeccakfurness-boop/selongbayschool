import type { Metadata } from 'next';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import Reveal from '@/components/Reveal';
import Button from '@/components/Button';
import AdmissionsStepper from '@/components/AdmissionsStepper';
import HowItWorksNav from '@/components/HowItWorksNav';
import {
  principalWelcome,
  hybridApproach,
  googleClassroom,
  policyLinks,
  freeShuttle,
  academicCalendarPdf,
  ourApproach,
  dailySchedule,
  temporaryEnrolments,
} from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    "Everything you need to know about how Selong Bay School works: our approach, a day in the life, fees, and the step-by-step admissions process.",
  openGraph: { title: 'How It Works - Selong Bay School' },
};

const sections = [
  { id: 'welcome', label: "Principal's Welcome" },
  { id: 'policies', label: 'Policies & Handbooks' },
  { id: 'hybrid', label: 'Hybrid Approach' },
  { id: 'temporary-enrolments', label: 'Temporary Enrolments' },
  { id: 'guide', label: 'World Schooling Guide' },
  { id: 'shuttle', label: 'Free Shuttle' },
  { id: 'calendar', label: 'Academic Calendar' },
  { id: 'approach', label: 'Our Approach' },
  { id: 'day', label: 'A Day at Selong Bay' },
  { id: 'enrol', label: 'How to Enrol' },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/home-mission-award-ceremony.jpg', alt: 'Students receiving certificates of achievement at Selong Bay School' }}
        card={{ script: 'Everything you need to know', heading: 'Our Approach: How It Works', align: 'left' }}
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[220px_1fr] md:items-start md:px-8">
        <HowItWorksNav sections={sections} />

        <div className="flex min-w-0 flex-col gap-16 md:gap-20">
          <section id="welcome" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Meet our principal</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">
                A message from {principalWelcome.name}
              </h2>
              <div className="mt-6 grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
                <div className="relative aspect-square w-full overflow-hidden rounded-md">
                  <Image src="/images/principal-indhira.jpg" alt="Ms Indhira, Principal of Selong Bay School" fill sizes="(min-width: 768px) 240px, 100vw" className="object-cover" />
                </div>
                <div className="space-y-4 text-[16px] leading-relaxed text-ink-soft">
                  {principalWelcome.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p className="text-sm font-bold uppercase tracking-wide text-teal-deep">
                    {principalWelcome.fullName}, {principalWelcome.role}
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          <section id="policies" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Good to know</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Policies &amp; Handbooks</h2>
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
                Download our full school policies and parent handbook for detailed information on how Selong Bay School runs
                day to day.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                {policyLinks.map((link) => (
                  <Button key={link.label} href={link.href} variant="ghost">
                    {link.label}
                  </Button>
                ))}
              </div>
            </Reveal>
          </section>

          <section id="hybrid" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Flexible by design</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Hybrid Approach</h2>

              <h3 className="mt-6 font-display text-xl font-semibold text-ink">{hybridApproach.heading}</h3>
              <div className="mt-4 max-w-prose space-y-4 text-[16px] leading-relaxed text-ink-soft">
                {hybridApproach.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-5">
                <Button href="/online-library" variant="primary">
                  Visit the Online Library
                </Button>
              </div>

              <div className="mt-10 border-t border-sand-line pt-8">
                <h3 className="font-display text-xl font-semibold text-ink">{googleClassroom.heading}</h3>
                <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-center">
                  <p className="text-[15px] leading-relaxed text-ink-soft">{googleClassroom.body}</p>
                  <div className="relative h-56 w-full overflow-hidden rounded-md">
                    <Image
                      src="/images/how-it-works-google-classroom.png"
                      alt="The Google Classroom home screen showing a student's class cards"
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <section id="temporary-enrolments" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Flexible learning options</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">
                {temporaryEnrolments.teaser.heading}
              </h2>
              <p className="mt-4 max-w-prose text-[16px] leading-relaxed text-ink-soft">
                {temporaryEnrolments.teaser.body}
              </p>
              <div className="mt-6">
                <Button href="/admissions#temporary-enrolments" variant="primary">
                  Learn More
                </Button>
              </div>
            </Reveal>
          </section>

          <section id="guide" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">For travelling families</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">World Schooling Guide</h2>
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
                Our guide to world schooling with Selong Bay School is on its way.
              </p>
              <div className="mt-5">
                <Button disabled variant="primary">
                  Download the World Schooling Guide (Coming Soon)
                </Button>
              </div>
            </Reveal>
          </section>

          <section id="shuttle" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Getting to campus</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Free Shuttle</h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2 md:items-center">
                <p className="text-[15px] leading-relaxed text-ink-soft">{freeShuttle.body}</p>
                <div className="relative h-56 w-full overflow-hidden rounded-md">
                  <Image src="/images/how-it-works-shuttle-van.jpg" alt="The free Selong Bay School shuttle van" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
              </div>
            </Reveal>
          </section>

          <section id="calendar" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Plan ahead</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Academic Calendar</h2>
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
                Browse our academic calendar below, or scroll within the viewer to see the full document.
              </p>
              <div className="mt-5 overflow-hidden rounded-md border border-sand-line shadow-soft">
                <iframe src={academicCalendarPdf} title="Academic Calendar" className="h-[600px] w-full" />
              </div>
            </Reveal>
          </section>

          <section id="approach" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Our approach</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">{ourApproach.heading}</h2>
              <div className="mt-5 max-w-prose space-y-4 text-[16px] leading-relaxed text-ink-soft">
                {ourApproach.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <p>
                  <a href="/foundation-and-charity" className="font-semibold text-teal-deep underline">
                    See more about our charitable work
                  </a>
                </p>
              </div>
            </Reveal>
          </section>

          <section id="day" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">A typical day</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">A Day at Selong Bay</h2>
              <div className="mt-5 overflow-x-auto rounded-md border border-sand-line bg-paper">
                <table className="w-full min-w-[380px] border-collapse text-[15px]">
                  <tbody>
                    {dailySchedule.map((row) => (
                      <tr key={row.time} className="border-b border-sand-line/60 last:border-0">
                        <td className="whitespace-nowrap px-5 py-3 font-bold tabular-nums text-teal-deep">{row.time}</td>
                        <td className="px-5 py-3 text-ink-soft">{row.activity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Students can enrol for 1 week, 1 month, 1 term, or a full year.
              </p>
            </Reveal>
          </section>

          <section id="enrol" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Ready to join us?</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">How to Enrol</h2>
              <div className="mt-6">
                <AdmissionsStepper />
              </div>
              <div className="mt-8">
                <Button href="/admissions" variant="primary">
                  Start the admissions process
                </Button>
              </div>
            </Reveal>
          </section>
        </div>
      </div>
    </div>
  );
}
