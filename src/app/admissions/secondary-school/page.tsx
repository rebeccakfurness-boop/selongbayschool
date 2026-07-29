import type { Metadata } from 'next';
import AdmissionsGroupPage from '@/components/AdmissionsGroupPage';
import Button from '@/components/Button';
import Reveal from '@/components/Reveal';
import { admissionsGroups, secondaryProgrammePdf } from '@/lib/site-content';

const group = admissionsGroups.find((g) => g.slug === 'secondary-school')!;

export const metadata: Metadata = {
  title: 'Secondary School Admissions',
  description: 'Secondary School at Selong Bay School: overview, pricing, curriculum, teachers, and how to enquire for students aged 13-18.',
  openGraph: { title: 'Secondary School Admissions - Selong Bay School' },
};

export default function SecondaryAdmissionsPage() {
  return (
    <>
      <AdmissionsGroupPage group={group} />
      <Reveal>
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-4 text-center md:px-8">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-sand-line bg-aqua/40 p-8">
            <p className="text-[15px] text-ink-soft">
              Want the full details on our Secondary School Programme &mdash; HSPG Bali partnership, subjects, activities, and pricing?
            </p>
            <Button href={secondaryProgrammePdf} variant="accent" external>
              Download the Secondary School Programme (PDF)
            </Button>
          </div>
        </div>
      </Reveal>
    </>
  );
}
