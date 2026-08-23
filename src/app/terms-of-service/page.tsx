import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { siteConfig } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply to using the Selong Bay School website and parent/student portal.',
  openGraph: { title: 'Terms of Service - Selong Bay School' },
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
  { id: 'acceptance', label: 'Acceptance of these terms' },
  { id: 'using-the-website', label: 'Using the website' },
  { id: 'the-portal', label: 'The parent, student, and staff portal' },
  { id: 'admissions', label: 'Enquiries, admissions, and enrolment' },
  { id: 'fees', label: 'Fees and payment' },
  { id: 'content-ip', label: 'Our content and intellectual property' },
  { id: 'your-content', label: 'Content you submit to us' },
  { id: 'third-party-links', label: 'Third-party links and services' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'liability', label: 'Limitation of liability' },
  { id: 'governing-law', label: 'Governing law' },
  { id: 'changes', label: 'Changes to these terms' },
  { id: 'contact', label: 'Contact us' },
];

export default function TermsOfServicePage() {
  return (
    <div className="pb-20">
      <div className="bg-cream border-b border-sand-line">
        <div className="mx-auto max-w-4xl px-6 py-14 md:px-8 md:py-20">
          <p className="font-script text-3xl text-orange-deep md:text-4xl">The fine print</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Terms of Service</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
            Last updated: August 2026. These terms govern your use of the Selong Bay School website and the
            parent/student/admin portal. By using either, you agree to them.
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
            <Section id="acceptance" title="Acceptance of these terms">
              <p>
                These terms are between you and Yayasan Selong Bay Sekolah, the Indonesian non-profit foundation
                that operates Selong Bay School, trading as &ldquo;Selong Bay School&rdquo;. They apply to{' '}
                {siteConfig.url.replace('https://', '')}{' '}
                and every page under it, including the parent portal (/account), the student portal (/student), and
                the staff admin dashboard (/admin). If you don&apos;t
                agree with these terms, please don&apos;t use the website or portal, and get in touch instead at{' '}
                <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-teal-deep underline">
                  {siteConfig.contact.email}
                </a>
                .
              </p>
              <p>
                How we handle personal data is covered separately in our{' '}
                <Link href="/privacy-policy" className="font-semibold text-teal-deep underline">
                  Privacy Policy
                </Link>
                , which forms part of these terms.
              </p>
            </Section>

            <Section id="using-the-website" title="Using the website">
              <p>
                The public parts of this site are here to give prospective and current families accurate information
                about the school: our approach, admissions, activities, and how to get in touch. You&apos;re welcome
                to browse it and share it. Please don&apos;t attempt to disrupt the site, scrape it at scale, or use
                it in any way that could damage, disable, or overburden it or interfere with anyone else&apos;s use
                of it.
              </p>
            </Section>

            <Section id="the-portal" title="The parent, student, and staff portal">
              <p>
                Access to the parent portal, student portal, and admin dashboard is by invitation from the school:
                typically once your child is enrolled, or once you become a staff member. Login is by a one-time
                email link (for parents and students) or an email and password (for staff); there is no password to
                remember for the parent and student portals.
              </p>
              <p>You agree to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>keep your login email account secure, since anyone with access to it can request a login link;</li>
                <li>only view or update information relating to your own child, unless the school has separately linked another child to your account;</li>
                <li>keep the information you provide (contact details, medical/allergy notes, and so on) accurate and up to date, since this matters for your child&apos;s safety; and</li>
                <li>use the portal only for its intended purpose of managing your family&apos;s relationship with the school.</li>
              </ul>
              <p>
                We may suspend or remove portal access if we reasonably believe it&apos;s being misused, or if a
                child leaves the school.
              </p>
            </Section>

            <Section id="admissions" title="Enquiries, admissions, and enrolment">
              <p>
                Submitting an enquiry, tour booking, or the online Student Enrolment Form is an expression of
                interest, not a confirmed place at the school: a place is only confirmed once the school issues a
                Letter of Offer and it&apos;s accepted, and enrolment is finalised once the required compliance
                forms (Liability Waiver, Financial Agreement, Photography &amp; Social Media Consent, Personal Data
                Consent, and the others on your child&apos;s enrolment checklist) are signed. Where anything in this
                page conflicts with a signed enrolment document, the signed document governs for that family.
              </p>
            </Section>

            <Section id="fees" title="Fees and payment">
              <p>
                Tuition, activity, and lunch fees are set out in the fee schedule provided at enrolment and on
                invoices issued through the parent portal, payable by bank transfer to the account details on the
                invoice. The specific payment terms, late-payment handling, and withdrawal notice period your family
                has agreed to are set out in full in the Financial Agreement signed at enrolment. These Terms of
                Service don&apos;t repeat or override that agreement.
              </p>
            </Section>

            <Section id="content-ip" title="Our content and intellectual property">
              <p>
                The Selong Bay School name and logo, and the text, photos, and design on this website, belong to
                Yayasan Selong Bay Sekolah or are used with permission (for example, photos of students used under
                the family&apos;s Photography &amp; Social Media Consent). Please don&apos;t reproduce, redistribute,
                or use any of it for your own commercial purposes without asking us first. We&apos;re usually happy
                to help if you have a genuine reason to use something.
              </p>
            </Section>

            <Section id="your-content" title="Content you submit to us">
              <p>
                Anything you submit through a form, upload to the portal, or send us by email is used only for the
                purposes described in our{' '}
                <Link href="/privacy-policy" className="font-semibold text-teal-deep underline">
                  Privacy Policy
                </Link>. We don&apos;t publish your messages, photos, or documents anywhere without asking first, beyond
                what&apos;s already covered by a form you&apos;ve signed (like photography consent).
              </p>
            </Section>

            <Section id="third-party-links" title="Third-party links and services">
              <p>
                This site links to and embeds a small number of third-party services: Instagram, Facebook,
                WhatsApp, Google Maps, and, for staff, Google Classroom and Google Calendar. We don&apos;t control
                those services and aren&apos;t responsible for their content, availability, or their own terms and
                privacy practices.
              </p>
            </Section>

            <Section id="disclaimer" title="Disclaimer">
              <p>
                We do our best to keep information on this site accurate and current, but term dates, fees,
                activities, staff, and programmes can change. Always confirm anything time-sensitive directly with
                the school office. The website and portal are provided on an &ldquo;as is&rdquo; basis, and while we
                aim to keep them available and working correctly, we can&apos;t guarantee they&apos;ll be
                uninterrupted or error-free.
              </p>
            </Section>

            <Section id="liability" title="Limitation of liability">
              <p>
                To the fullest extent permitted under Indonesian law, Yayasan Selong Bay Sekolah is not liable for
                indirect or consequential loss arising from your use of this website or portal. Nothing here limits
                or excludes any liability that can&apos;t lawfully be limited or excluded, and nothing here affects
                the separate Liability Waiver that governs participation in the school&apos;s physical, on-campus,
                and off-campus activities; that waiver, not these terms, is what applies to activity-related injury
                or loss.
              </p>
            </Section>

            <Section id="governing-law" title="Governing law">
              <p>
                These terms are governed by the laws of the Republic of Indonesia, and any dispute arising from them
                will be subject to the jurisdiction of the courts of Nusa Tenggara Barat, Indonesia.
              </p>
            </Section>

            <Section id="changes" title="Changes to these terms">
              <p>
                We may update these terms from time to time as the website and portal evolve. The &ldquo;Last
                updated&rdquo; date at the top of this page always reflects the current version. Please check back
                occasionally, especially before relying on anything time-sensitive.
              </p>
            </Section>

            <Section id="contact" title="Contact us">
              <p>Questions about these terms are always welcome:</p>
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
                <Link href="/privacy-policy" className="font-semibold text-teal-deep underline">
                  Privacy Policy
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
