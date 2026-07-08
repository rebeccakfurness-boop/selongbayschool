import type { Metadata } from 'next';
import { Suspense } from 'react';
import PhotoBanner from '@/components/PhotoBanner';
import AdmissionsStepper from '@/components/AdmissionsStepper';
import AdmissionsForm from '@/components/forms/AdmissionsForm';
import Reveal from '@/components/Reveal';
import { ageGroups, dailySchedule, pricing2026, formatIDR } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Admissions',
  description:
    'How to enrol your child at Selong Bay School: curriculum, age groups, 2026 pricing, and our step-by-step admissions process.',
  openGraph: { title: 'Admissions - Selong Bay School' },
};

export default function AdmissionsPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/about-community.jpg', alt: 'Selong Bay School students and families gathered on the beach' }}
        card={{ script: 'Join our school', heading: 'Enrol your child at Selong Bay', align: 'left' }}
      />

      <div className="mx-auto max-w-4xl px-6 md:px-8">
        <p className="rounded-md border border-teal/20 bg-aqua/40 px-5 py-4 text-[15px] text-ink-soft">
          This page is for families who&apos;d like their child to attend Selong Bay School full-time, on campus or online.
          Looking for a one-off activity or camp instead? Visit{' '}
          <a href="/activities" className="font-semibold text-teal-deep underline">
            Activities &amp; Camps
          </a>
          .
        </p>
      </div>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our approach</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">A curriculum built for both worlds</h2>
          <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-soft">
            <p>
              Selong Bay School operates under Yayasan Selong Bay Intercultural Sekolah, a registered non-profit foundation.
              We are not for profit. We are for the children and the community of South Lombok. All funds are reinvested
              into the school&apos;s development, including scholarships, community programmes, and training opportunities
              for local teachers and staff.
            </p>
            <p>
              Our curriculum blends Cambridge International Education with the Australian National Curriculum and our own
              Selong Bay approach: play-based in the Early Years, inquiry-based through Primary, alongside Bahasa
              Indonesia and Religious Studies as required by Indonesian government regulation.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">A day at Selong Bay</h2>
          <div className="mt-5 overflow-x-auto rounded-md border border-sand-line bg-paper">
            <table className="w-full min-w-[420px] border-collapse text-[15px]">
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
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Age groups &amp; 2026 fees</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ageGroups.map((group) => (
              <span key={group.name} className="rounded-full bg-sand px-4 py-1.5 text-sm font-semibold text-ink">
                {group.name} &middot; {group.ages}
              </span>
            ))}
          </div>
          <div className="mt-5 overflow-x-auto rounded-md border border-sand-line bg-paper">
            <table className="w-full min-w-[560px] border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-sand-line bg-sand/40 text-left">
                  <th className="px-5 py-3 font-bold text-ink-soft">Level</th>
                  <th className="px-5 py-3 text-right font-bold text-ink-soft">Annual</th>
                  <th className="px-5 py-3 text-right font-bold text-ink-soft">Per term</th>
                </tr>
              </thead>
              <tbody>
                {pricing2026.map((row) => (
                  <tr key={row.level} className="border-b border-sand-line/60 last:border-0">
                    <td className="px-5 py-3 text-ink">{row.level}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-soft">{formatIDR(row.annual)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-soft">{formatIDR(row.perTerm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            A 5% discount applies if the annual fee is paid upfront. Prices include online membership, development, and
            resource fees; they exclude activities costs and lunch.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">How to enrol</h2>
          <div className="mt-6">
            <AdmissionsStepper />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-2xl px-6 md:px-8" id="enquire">
          <div className="rounded-lg border border-sand-line bg-paper p-8 shadow-soft md:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink">Application for enrolment</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Please complete all fields and submit the form to begin enrolling your child at the school. This is not a
              confirmation of enrolment, but all student details must be received in order to apply for enrolment.
            </p>
            <div className="mt-6">
              <Suspense fallback={null}>
                <AdmissionsForm />
              </Suspense>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
