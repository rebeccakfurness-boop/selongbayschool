import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { siteConfig } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Selong Bay School collects, uses, and protects personal data belonging to families, students, and website visitors.',
  openGraph: { title: 'Privacy Policy - Selong Bay School' },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">{title}</h2>
      <div className="mt-3 space-y-4 text-[16px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

const TOC = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'information-we-collect', label: 'Information we collect' },
  { id: 'how-we-use-it', label: 'How we use this information' },
  { id: 'legal-basis', label: 'Our legal basis (Indonesia’s PDP Law)' },
  { id: 'cookies', label: 'Cookies and similar technology' },
  { id: 'who-we-share-with', label: 'Who we share information with' },
  { id: 'childrens-privacy', label: 'Children’s privacy' },
  { id: 'data-retention', label: 'How long we keep information' },
  { id: 'data-security', label: 'How we protect information' },
  { id: 'international-transfers', label: 'Where information is stored' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'changes', label: 'Changes to this policy' },
  { id: 'contact', label: 'Contact us' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-20">
      <div className="bg-cream border-b border-sand-line">
        <div className="mx-auto max-w-4xl px-6 py-14 md:px-8 md:py-20">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">Your trust matters to us</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
            Last updated: August 2026. This policy explains what personal data Selong Bay School collects — from
            website visitors, prospective families, and enrolled families using our parent portal — why we collect
            it, and the choices and rights you have over it.
          </p>
        </div>
      </div>

      <Reveal>
        <div className="mx-auto mt-12 max-w-4xl px-6 md:px-8">
          <nav aria-label="Table of contents" className="mb-12 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">On this page</p>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-[15px] font-semibold text-teal-deep hover:underline">
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col gap-10">
            <Section id="who-we-are" title="Who we are">
              <p>
                Selong Bay School is operated by Yayasan Selong Bay Sekolah, a registered Indonesian non-profit
                foundation, based at Dusun Serangan, Selong Belanak, Kecamatan Praya Barat, Kabupaten Lombok
                Tengah, Nusa Tenggara Barat, Indonesia. This policy covers {siteConfig.url.replace('https://', '')}{' '}
                and the parent/admin portal at <span className="whitespace-nowrap">/account</span>, /admin, and{' '}
                /student.
              </p>
              <p>
                For anything in this policy, or to exercise any of the rights described below, contact us at{' '}
                <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-teal-deep underline">
                  {siteConfig.contact.email}
                </a>{' '}
                or the school office.
              </p>
            </Section>

            <Section id="information-we-collect" title="Information we collect">
              <p>
                <strong className="text-ink">From anyone visiting the website:</strong> whatever you submit through
                the Contact form or Student Enrolment form on the Admissions/Contact pages — name, email, phone
                number, and your message or enquiry details.
              </p>
              <p>
                <strong className="text-ink">From parents and guardians using the parent portal:</strong> your
                account email address; your child&apos;s name, date of birth, nationality, class, and programme;
                emergency contact and medical/allergy/dietary information you provide for your child&apos;s safety;
                photographs of your child you upload or that staff post to their learning feed; identity documents
                you choose to upload (passport copy, KITAS copy, birth certificate); attendance check-in/out records
                and the signature used to confirm them; invoices and the fee/payment details on them (we do not
                collect or store card numbers — fees are paid by bank transfer); and lunch orders you place.
              </p>
              <p>
                <strong className="text-ink">From students with their own login:</strong> a login email and whatever
                is needed to show them their own class&apos;s lessons and Google Classroom assignments.
              </p>
              <p>
                <strong className="text-ink">From school staff:</strong> a work email and password (stored as a
                one-way hash, never in plain text) used to sign in to the admin dashboard, and records of the actions
                a staff member takes there (e.g. who signed a compliance form on the school&apos;s behalf, who
                recorded an attendance check-in).
              </p>
              <p>
                <strong className="text-ink">Automatically:</strong> our hosting provider keeps standard technical
                logs (like IP address and browser type) for security and reliability, the same as almost any
                website. We do not run any analytics or advertising tracking on this site — see{' '}
                <a href="#cookies" className="font-semibold text-teal-deep underline">Cookies</a> below.
              </p>
            </Section>

            <Section id="how-we-use-it" title="How we use this information">
              <p>We use personal data to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>respond to enquiries and process admissions and enrolment;</li>
                <li>
                  educate and care for enrolled students — attendance, learning profiles and term reports, lesson
                  plans, work samples, and Google Classroom coursework;
                </li>
                <li>keep students safe, including administering first aid and contacting you in an emergency;</li>
                <li>administer fees, generate invoices, and manage lunch and activity bookings;</li>
                <li>communicate with families about school life, events, and administrative matters;</li>
                <li>
                  meet our own legal and regulatory obligations, including reporting to the Indonesian Ministry of
                  Education where required; and
                </li>
                <li>keep the website and portal secure and working properly.</li>
              </ul>
              <p>
                We do not use personal data for advertising, and we do not sell personal data to anyone, under any
                circumstances.
              </p>
            </Section>

            <Section id="legal-basis" title="Our legal basis (Indonesia’s PDP Law)">
              <p>
                We process personal data in line with Indonesia&apos;s Law No. 27 of 2022 on Personal Data
                Protection (&ldquo;PDP Law&rdquo;). For enrolled families, this is primarily on the basis of the
                contract between you and the school (enrolment), your explicit consent (for example, the
                Photography &amp; Social Media Consent and Personal Data Consent forms signed at enrolment), and our
                legitimate interest in running the school safely and effectively. For website visitors, submitting a
                form is treated as consent to be contacted about that enquiry.
              </p>
            </Section>

            <Section id="cookies" title="Cookies and similar technology">
              <p>
                The parent, student, and admin portals use a single, essential session cookie so you stay logged in
                as you move between pages. It is not used to track you across other websites and is not shared with
                advertisers. We do not run Google Analytics, Facebook Pixel, or any similar tracking on this site.
              </p>
              <p>
                A few pages embed third-party content that can set its own cookies once it loads: the map on our
                Contact page (Google Maps) and, where enabled, our Instagram feed (via SnapWidget). These are
                controlled by Google and SnapWidget respectively under their own privacy policies, not ours.
              </p>
            </Section>

            <Section id="who-we-share-with" title="Who we share information with">
              <p>
                We only share personal data with the people and services that need it to help us run the school, and
                never sell it. The main services we use are:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong className="text-ink">Brevo</strong> — sends transactional emails (form confirmations, login links, invoices, notifications) on our behalf.</li>
                <li><strong className="text-ink">Vercel and Neon</strong> — host this website, our database, and uploaded files (photos and identity documents) securely.</li>
                <li>
                  <strong className="text-ink">Google Workspace / Google Classroom / Google Calendar</strong> — used
                  by staff to sync coursework and assignments, and to schedule meetings with parents; connected only
                  when a staff member sets it up, and only for the class/child data needed to make that feature work.
                </li>
              </ul>
              <p>
                Within the school, access to a child&apos;s record is limited to the staff who need it: their
                assigned teacher(s) can see academic and class information, while medical notes, financial records,
                and identity documents are visible only to the school office/admin and to that child&apos;s own
                parent or guardian.
              </p>
              <p>
                We may also disclose personal data if required by Indonesian law or a valid request from a public
                authority, or to protect the safety of a student or others in an emergency.
              </p>
            </Section>

            <Section id="childrens-privacy" title="Children’s privacy">
              <p>
                Selong Bay School is a school, so a large part of what we do necessarily involves personal data about
                children. That data is provided to us by parents/guardians (or by the child, under school
                supervision, for things like classwork), used only for the educational, safety, and administrative
                purposes described in this policy, and is never used to market anything to children directly. Photos
                of a child are only used publicly (on our website, social media, or promotional material) with the
                specific consent given on the Photography &amp; Social Media Consent form at enrolment, which a
                parent can withdraw at any time by contacting the school office.
              </p>
            </Section>

            <Section id="data-retention" title="How long we keep information">
              <p>
                We keep a website enquiry only as long as needed to respond to it and for a reasonable follow-up
                period. For enrolled families, we keep personal data for as long as your child is enrolled at
                Selong Bay School, and for a reasonable period afterwards to meet our academic, financial, and legal
                record-keeping obligations — after which it is securely deleted or anonymised.
              </p>
            </Section>

            <Section id="data-security" title="How we protect information">
              <p>
                We use industry-standard measures to protect personal data: connections to this site and the portal
                are encrypted (HTTPS), passwords are never stored in plain text, and access to family records inside
                the admin dashboard is limited by staff role, as described above. No system is completely immune to
                risk, but we take reasonable, ongoing steps to keep your information secure and will let you know if
                we ever become aware of a breach affecting your data.
              </p>
            </Section>

            <Section id="international-transfers" title="Where information is stored">
              <p>
                Some of the service providers listed above operate infrastructure outside Indonesia. Where personal
                data is processed or stored outside Indonesia, we rely on those providers&apos; own security and
                privacy safeguards, and only use providers who are contractually bound to protect your data to a
                comparable standard.
              </p>
            </Section>

            <Section id="your-rights" title="Your rights">
              <p>Under the PDP Law, and as a matter of course for our own families, you may:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>ask what personal data we hold about you or your child, and request a copy of it;</li>
                <li>ask us to correct information that is inaccurate or out of date;</li>
                <li>ask us to delete personal data we no longer have a valid reason to keep;</li>
                <li>object to, or withdraw consent for, a particular use of your data (for example, photography consent); and</li>
                <li>ask us any question about how your data is used.</li>
              </ul>
              <p>
                Parents can already update most of their own child&apos;s contact, medical, and dietary information
                directly in the parent portal at any time. For anything else, write to{' '}
                <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-teal-deep underline">
                  {siteConfig.contact.email}
                </a>{' '}
                and we will respond as promptly as we can — this is always subject to our own legitimate
                record-keeping and legal obligations, which may mean some data cannot be deleted immediately.
              </p>
            </Section>

            <Section id="changes" title="Changes to this policy">
              <p>
                We may update this policy from time to time, for example as the school introduces new features or as
                Indonesian data protection rules evolve. The &ldquo;Last updated&rdquo; date at the top of this page
                will always reflect the current version. For any material change affecting enrolled families, we
                will also let you know directly.
              </p>
            </Section>

            <Section id="contact" title="Contact us">
              <p>
                Questions about this policy or your personal data are always welcome:
              </p>
              <address className="not-italic">
                {siteConfig.name}
                <br />
                {siteConfig.contact.address}
                <br />
                <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-teal-deep underline">
                  {siteConfig.contact.email}
                </a>
                <br />
                <a href={siteConfig.contact.phoneHref} className="font-semibold text-teal-deep underline">
                  {siteConfig.contact.phone}
                </a>
              </address>
              <p>
                See also our{' '}
                <Link href="/terms-of-service" className="font-semibold text-teal-deep underline">
                  Terms of Service
                </Link>
                .
              </p>
            </Section>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
