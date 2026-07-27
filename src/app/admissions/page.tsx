import type { Metadata } from 'next';
import PhotoBanner from '@/components/PhotoBanner';
import Reveal from '@/components/Reveal';
import Button from '@/components/Button';
import PageSectionNav from '@/components/PageSectionNav';
import MaintenanceNotice from '@/components/MaintenanceNotice';
import AdmissionsGroupSection from '@/components/admissions/AdmissionsGroupSection';
import WorldSchoolingSection from '@/components/admissions/WorldSchoolingSection';
import OnlineHomeschoolingSection from '@/components/admissions/OnlineHomeschoolingSection';
import { admissionsGroups, temporaryEnrolments, feesSummary, formatIDR } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Admissions',
  description: 'Enrol your child at Selong Bay School: Preschool, Primary, Secondary School, World Schooling, and Online Homeschooling, all in one place.',
  openGraph: { title: 'Admissions - Selong Bay School' },
};

const preschool = admissionsGroups.find((g) => g.slug === 'preschool')!;
const primary = admissionsGroups.find((g) => g.slug === 'primary')!;
const secondarySchool = admissionsGroups.find((g) => g.slug === 'secondary-school')!;

const sections = [
  { id: 'preschool', label: 'Preschool' },
  { id: 'primary', label: 'Primary' },
  { id: 'secondary-school', label: 'Secondary School' },
  { id: 'world-schooling', label: 'World Schooling' },
  { id: 'online-homeschooling', label: 'Online Homeschooling' },
  { id: 'fees', label: 'Fees' },
  { id: 'temporary-enrolments', label: 'Temporary Enrolments' },
];

export default function AdmissionsPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <MaintenanceNotice />
      <PhotoBanner
        height="sm"
        image={{ src: '/images/admissions-hero-v2.jpg', alt: 'A student completing classwork at Selong Bay School' }}
        card={{ script: 'Join our school', heading: 'Enrol your child at Selong Bay', align: 'left' }}
      />

      <div className="mx-auto max-w-4xl px-6 md:px-8">
        <p className="rounded-md border border-teal/20 bg-aqua/40 px-5 py-4 text-[15px] text-ink-soft">
          This page is for families who&apos;d like their child to attend Selong Bay School full-time, on campus, hybrid, or
          online. Looking for a one-off activity or camp instead? Visit{' '}
          <a href="/activities" className="font-semibold text-teal-deep underline">
            Activities
          </a>
          . Want to know more about how the school runs day to day? See{' '}
          <a href="/how-it-works" className="font-semibold text-teal-deep underline">
            How It Works
          </a>
          .
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[220px_1fr] md:items-start md:px-8">
        <PageSectionNav sections={sections} ariaLabel="Admissions sections" />

        <div className="flex min-w-0 flex-col gap-16 md:gap-20">
          <AdmissionsGroupSection group={preschool} />
          <AdmissionsGroupSection group={primary} />
          <AdmissionsGroupSection group={secondarySchool} />
          <WorldSchoolingSection />
          <OnlineHomeschoolingSection />

          <section id="fees" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">Investing in your child</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Age Groups &amp; 2026 Fees</h2>
              <div className="mt-5 overflow-x-auto rounded-md border border-sand-line bg-paper">
                <table className="w-full min-w-[480px] border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b border-sand-line bg-sand/40 text-left">
                      <th className="px-5 py-3 font-bold text-ink-soft">Level</th>
                      <th className="px-5 py-3 font-bold text-ink-soft">Age</th>
                      <th className="px-5 py-3 text-right font-bold text-ink-soft">Per Term (starting from)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feesSummary.map((row) => (
                      <tr key={row.level} className="border-b border-sand-line/60 last:border-0">
                        <td className="px-5 py-3 text-ink">{row.level}</td>
                        <td className="px-5 py-3 text-ink-soft">{row.ages}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-ink-soft">{formatIDR(row.perTermFrom)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Full pricing schedule available upon request. A 5% discount applies if the annual fee is paid upfront.
                Prices include online membership, development, and resource fees; they exclude activity costs and lunch.
              </p>
            </Reveal>
          </section>

          <section id="temporary-enrolments" className="scroll-mt-32">
            <Reveal>
              <p className="font-script text-3xl text-orange-deep md:text-4xl">A flexible way to join us</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Temporary Enrolments</h2>
              <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-ink-soft">
                {temporaryEnrolments.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8">
                <Button href="/contact" variant="primary">
                  Contact Us to Discuss Your Child&apos;s Needs
                </Button>
              </div>
            </Reveal>
          </section>
        </div>
      </div>
    </div>
  );
}
