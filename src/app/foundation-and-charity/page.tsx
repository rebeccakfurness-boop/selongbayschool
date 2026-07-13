import type { Metadata } from 'next';
import Image from 'next/image';
import PhotoBanner from '@/components/PhotoBanner';
import Reveal from '@/components/Reveal';
import { charitableWork, communityPartners } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Foundation & Charity',
  description:
    'Yayasan Selong Bay Sekolah, the non-profit foundation behind Selong Bay School, and our charitable work in the local community through the Serangan English School.',
  openGraph: { title: 'Foundation & Charity - Selong Bay School' },
};

export default function FoundationAndCharityPage() {
  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        image={{ src: '/images/foundation-community-teaching.jpg', alt: 'Selong Bay School staff spending time with students and the local Serangan community' }}
        card={{ script: 'Not for profit', heading: 'Foundation & Charity', align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Our foundation</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Yayasan Selong Bay Sekolah</h2>
          <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-soft">
            <p>
              Selong Bay School operates under Yayasan Selong Bay Sekolah, a registered Indonesian non-profit foundation and
              the legal body that governs the school. A yayasan is the formal structure under Indonesian law for non-profit,
              mission-driven organisations, and it is Yayasan Selong Bay Sekolah that holds ultimate responsibility for the
              school&apos;s governance, finances, and long-term direction.
            </p>
            <p>
              The foundation exists for one reason: to serve the children and the community of South Lombok. Selong Bay
              School is not for profit. Every fee paid by families is reinvested directly into the school&apos;s development,
              funding scholarships for local students, community programmes such as the Serangan English School, and ongoing
              training for our local teachers and staff.
            </p>
            <p>
              Yayasan Selong Bay Sekolah is guided by a dedicated foundation board who oversee its work, ensuring the school
              stays true to its mission as it grows.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-md border border-sand-line shadow-soft">
            <Image
              src="/images/about-yayasan-board.jpg"
              alt="Yayasan Selong Bay Sekolah, the non-profit foundation board behind the school"
              width={1920}
              height={1080}
              className="w-full"
            />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Charitable work</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">{charitableWork.heading}: The Serangan English School</h2>
          <div className="mt-5 grid items-center gap-6 md:grid-cols-2">
            <div className="space-y-4 text-[16px] leading-relaxed text-ink-soft">
              <p>{charitableWork.body}</p>
              <p>
                English is one of the most valuable skills for young people growing up in South Lombok, opening doors to
                further education, tourism, and hospitality work in a region shaped by its natural beauty. Through games,
                conversation practice, and structured lessons, our team helps build confidence and practical language skills
                that make a real difference beyond the classroom.
              </p>
              <p>
                The Serangan English School is one of the clearest expressions of Yayasan Selong Bay Sekolah&apos;s mission:
                reinvesting in the community that welcomes us, and making sure the benefits of our school reach beyond our
                own students and families.
              </p>
            </div>
            <div className="relative h-64 w-full overflow-hidden rounded-md">
              <Image
                src="/images/foundation-serangan-english-school.jpg"
                alt="A Selong Bay School teacher and volunteer teaching students at the Serangan English School"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Working together</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Our Community Partners</h2>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
            We&apos;re grateful to work alongside local and community organisations who share our commitment to South
            Lombok.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {communityPartners.map((partner) => (
              <div
                key={partner.name}
                className="flex flex-col items-center gap-2 rounded-md border border-sand-line bg-paper p-5 text-center"
              >
                <div className="relative h-14 w-full">
                  <Image src={partner.logo} alt={`${partner.name} logo`} fill sizes="200px" className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{partner.name}</p>
                  {partner.subtitle && (
                    <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-teal-deep">{partner.subtitle}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-teal-deep underline"
                  >
                    Website
                  </a>
                  <a
                    href={partner.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-teal-deep underline"
                  >
                    {partner.instagramHandle}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
