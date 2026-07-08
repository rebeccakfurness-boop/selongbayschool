import type { Metadata } from 'next';
import PhotoBanner from '@/components/PhotoBanner';
import ContactForm from '@/components/forms/ContactForm';
import Reveal from '@/components/Reveal';
import { siteConfig } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Selong Bay School — address, phone, email, and a contact form for general enquiries.',
  openGraph: { title: 'Contact — Selong Bay School' },
};

export default function ContactPage() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(siteConfig.contact.mapQuery)}&output=embed`;

  return (
    <div className="flex flex-col gap-16 pb-20 md:gap-24">
      <PhotoBanner
        height="sm"
        placeholderName="contact-campus-entrance.jpg"
        card={{ script: "We'd love to hear from you", heading: 'Contact us', align: 'left' }}
      />

      <Reveal>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:px-8">
          <div className="rounded-lg border border-sand-line bg-paper p-8 shadow-soft">
            <h2 className="font-display text-2xl font-semibold text-ink">Send us a message</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              For enrolment enquiries, use our{' '}
              <a href="/admissions#enquire" className="font-semibold text-teal-deep underline">
                admissions form
              </a>{' '}
              instead — this one is for general questions.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-sand-line bg-paper p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">Get in touch directly</h2>
              <dl className="mt-4 flex flex-col gap-4 text-[15px]">
                <div>
                  <dt className="font-bold text-teal-deep">Address</dt>
                  <dd className="text-ink-soft">{siteConfig.contact.address}</dd>
                </div>
                <div>
                  <dt className="font-bold text-teal-deep">Phone / WhatsApp</dt>
                  <dd>
                    <a href={siteConfig.contact.phoneHref} className="text-ink-soft hover:text-teal-deep">
                      {siteConfig.contact.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-teal-deep">Email</dt>
                  <dd>
                    <a href={`mailto:${siteConfig.contact.email}`} className="text-ink-soft hover:text-teal-deep">
                      {siteConfig.contact.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-teal-deep">Instagram</dt>
                  <dd>
                    <a
                      href={siteConfig.contact.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-soft hover:text-teal-deep"
                    >
                      @selongbayschool
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="overflow-hidden rounded-lg border border-sand-line">
              <iframe
                title="Map to Selong Bay School"
                src={mapSrc}
                className="h-72 w-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
