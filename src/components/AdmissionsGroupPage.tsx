import { Suspense } from 'react';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import Reveal from '@/components/Reveal';
import Button from '@/components/Button';
import AdmissionsForm from '@/components/forms/AdmissionsForm';
import { PlaceholderImage } from '@/components/PlaceholderBox';
import { formatIDR, teachers, type AdmissionsGroup } from '@/lib/site-content';

export default function AdmissionsGroupPage({ group }: { group: AdmissionsGroup }) {
  const hasAgeColumn = group.pricing.some((row) => row.ageRange);
  const featuredTeachers = group.featuredTeachers
    .map((name) => teachers.find((t) => t.name === name))
    .filter((t): t is (typeof teachers)[number] => Boolean(t));

  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={group.heroImage}
        card={{ script: `Ages ${group.ages}`, heading: group.label, align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Overview</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">{group.label} at Selong Bay</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">{group.overview}</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Pricing</h2>
          <div className="mt-5 overflow-x-auto rounded-md border border-sand-line bg-paper">
            <table className="w-full min-w-[420px] border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-sand-line bg-sand/40 text-left">
                  <th className="px-5 py-3 font-bold text-ink-soft">Programme</th>
                  {hasAgeColumn && <th className="px-5 py-3 font-bold text-ink-soft">Age</th>}
                  <th className="px-5 py-3 text-right font-bold text-ink-soft">Per Term (starting from)</th>
                </tr>
              </thead>
              <tbody>
                {group.pricing.map((row) => (
                  <tr key={row.programme} className="border-b border-sand-line/60 last:border-0">
                    <td className="px-5 py-3 text-ink">{row.programme}</td>
                    {hasAgeColumn && <td className="px-5 py-3 text-ink-soft">{row.ageRange ? `Ages ${row.ageRange}` : ''}</td>}
                    <td className="px-5 py-3 text-right tabular-nums text-ink-soft">{formatIDR(row.perTermFrom)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            Full pricing schedule available upon request. A 5% discount applies if the annual fee is paid upfront. Prices
            include online membership, development, and resource fees; they exclude activity costs and lunch.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Curriculum</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{group.curriculum}</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 text-center md:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Teachers</h2>
          <p className="mt-3 text-[15px] text-ink-soft">Meet the team who&apos;ll get to know your child personally.</p>

          {featuredTeachers.length > 0 && (
            <div className="mt-6 grid gap-5 text-left sm:grid-cols-2">
              {featuredTeachers.map((teacher) => (
                <div key={teacher.name} className="flex gap-4 rounded-md border border-sand-line bg-paper p-5">
                  {teacher.image ? (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full">
                      <Image src={teacher.image.src} alt={teacher.image.alt} fill sizes="80px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full">
                      <PlaceholderImage label={teacher.name.split(' ')[0]} className="h-full text-[10px]" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">{teacher.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">{teacher.role}</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{teacher.shortIntro}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button href="/about#teachers" variant="ghost">
              See All Teachers
            </Button>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-2xl px-6 md:px-8" id="enquire">
          <div className="rounded-lg border border-sand-line bg-paper p-8 shadow-soft md:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink">Enquiry Form</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Please complete all fields and submit the form to begin enrolling your child at the school. This is not a
              confirmation of enrolment, but all student details must be received in order to apply for enrolment.
            </p>
            <div className="mt-6">
              <Suspense fallback={null}>
                <AdmissionsForm defaultInterest={group.label} />
              </Suspense>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
