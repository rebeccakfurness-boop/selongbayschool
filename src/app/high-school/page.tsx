import type { Metadata } from 'next';
import PhotoBanner from '@/components/PhotoBanner';
import StorySection from '@/components/StorySection';
import HighSchoolForm from '@/components/forms/HighSchoolForm';
import Reveal from '@/components/Reveal';
import Button from '@/components/Button';

export const metadata: Metadata = {
  title: 'High School',
  description:
    'Selong Bay School now offers high school options for students aged 13-18. Cambridge and Australian curriculum, hybrid on-campus and online learning in Lombok.',
  openGraph: { title: 'High School — Selong Bay School' },
};

export default function HighSchoolPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="md"
        placeholderName="high-school-surfers.jpg"
        card={{ script: 'Now open', heading: 'High School is now open!', align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 text-center md:px-8">
          <p className="text-balance text-lg leading-relaxed text-ink-soft">
            Selong Bay School now offers high school options for students aged 13–18 years old, using the same hybrid
            model that makes our Primary years work so well for travelling and locally based families alike.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <StorySection
            eyebrowScript="Growing up at Selong Bay"
            heading="A curriculum that travels with them"
            placeholderName="high-school-classroom.jpg"
          >
            <p>
              High school students continue with the same blend that anchors every year level at Selong Bay: Cambridge
              International Education and the Australian National Curriculum, delivered through structured online study
              paired with on-campus connection, project work, and hands-on learning.
            </p>
            <p>
              Families can choose fully on-site, fully online, or a mix of both — moving between the two as travel or life
              demands, without disrupting their teenager&apos;s learning or friendships.
            </p>
          </StorySection>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto grid max-w-4xl gap-6 px-6 sm:grid-cols-2 md:px-8">
          <div className="rounded-md border border-sand-line bg-paper p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Already know Selong Bay is right for you?</h3>
            <p className="mt-2 text-[15px] text-ink-soft">
              Head to our full admissions process — it&apos;s pre-filled with High School as your interest area.
            </p>
            <Button href="/admissions?interest=High%20School" variant="primary" className="mt-4">
              Start the admissions process
            </Button>
          </div>
          <div className="rounded-md border border-sand-line bg-paper p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Just want more information first?</h3>
            <p className="mt-2 text-[15px] text-ink-soft">Send us a quick note below and we&apos;ll be in touch.</p>
            <div className="mt-4">
              <HighSchoolForm defaultMessage="Send me info on the high school please" />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
