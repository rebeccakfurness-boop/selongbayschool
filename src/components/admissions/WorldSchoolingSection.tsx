import type { ReactNode } from 'react';
import Image from 'next/image';
import Reveal from '@/components/Reveal';
import Button from '@/components/Button';
import { activitiesGallery } from '@/lib/site-content';

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[16px] leading-relaxed text-ink-soft">
      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function WorldSchoolingSection() {
  return (
    <section id="world-schooling" className="scroll-mt-32">
      <div className="flex flex-col gap-14 md:gap-20">
        <Reveal>
          <h2 className="text-balance font-display text-2xl font-semibold text-teal-deep md:text-3xl">
            World Schooling at Selong Bay School
          </h2>
        </Reveal>

        {/* What is World Schooling? */}
        <Reveal>
          <div>
            <p className="font-script text-3xl text-orange-deep md:text-4xl">Our approach</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">What is World Schooling?</h3>
            <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-soft">
              <p>
                World schooling is an approach to education where learning happens through travel, real-world experiences,
                and immersion in different cultures and environments, rather than being confined to a traditional classroom.
                Families who world school often travel for extended periods, using the places they visit as living
                classrooms: learning geography by exploring a coastline, biology through jungle treks, marine science
                through surfing and snorkelling, and social studies through meeting local communities.
              </p>
              <p>
                Many world schooling families combine this approach with homeschooling curricula, unschooling philosophies,
                or online schools, dropping into local communities and programmes along the way for structure,
                socialisation, and hands-on activities. Selong Bay School is proud to be one of those stops for families
                travelling through Lombok.
              </p>
            </div>
          </div>
        </Reveal>

        <hr className="w-full border-t border-sand-line" />

        {/* How World Schooling Works at Selong Bay School */}
        <Reveal>
          <div>
            <p className="font-script text-3xl text-orange-deep md:text-4xl">Flexible by design</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">How World Schooling Works at Selong Bay School</h3>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
              We&apos;ve designed our programme to be flexible, so it can fit around however your family travels and learns.
            </p>

            <h4 className="mt-8 font-display text-xl font-semibold text-ink">Join in the way that suits you:</h4>
            <ul className="mt-4 flex flex-col gap-3">
              <Bullet>
                <strong className="font-semibold text-ink">Afternoon activities only</strong> — drop in for surfing, art,
                sports, or other afternoon sessions without committing to a full school day.
              </Bullet>
              <Bullet>
                <strong className="font-semibold text-ink">Any number of days</strong> — stay for a single day, a week, or
                several weeks. There&apos;s no minimum commitment, and no need to enrol for a full term.
              </Bullet>
              <Bullet>
                <strong className="font-semibold text-ink">Full days or half days</strong> — choose whichever rhythm suits
                your child and your travel plans.
              </Bullet>
            </ul>

            <h4 className="mt-8 font-display text-xl font-semibold text-ink">Community at the centre:</h4>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">
              World schooling is as much about connection as it is about curriculum, so we build in regular opportunities
              for families to meet, share, and explore together:
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              <Bullet>
                <strong className="font-semibold text-ink">Wednesday community get-togethers</strong> — held after our
                surfing session at Selong Belanak, this is a relaxed chance for world schooling and homeschooling families
                to connect, swap stories, and get to know each other over the water and on the beach.
              </Bullet>
              <Bullet>
                <strong className="font-semibold text-ink">Meet other world schooling and homeschooling families</strong> —
                Selong Bay attracts a steady stream of travelling families, so your children (and you) can build
                friendships with others living a similar lifestyle.
              </Bullet>
              <Bullet>
                <strong className="font-semibold text-ink">Library and learning resources</strong> — visiting students have
                access to our library and learning materials for the duration of their stay.
              </Bullet>
            </ul>

            <div className="mt-6 max-w-lg overflow-hidden rounded-md border border-sand-line shadow-soft">
              <Image
                src="/images/worldschooling-surfing.jpg"
                alt="Children sitting on surfboards on the beach at Selong Belanak during a surf session"
                width={2000}
                height={1125}
                className="w-full"
              />
            </div>

            <h4 className="mt-8 font-display text-xl font-semibold text-ink">Exploring Lombok together:</h4>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">
              Part of the world schooling experience is discovering the island itself, and we&apos;re happy to help arrange
              it:
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="text-[16px] leading-relaxed text-ink-soft">
                <div className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden="true" />
                  <span>Support with booking outside activities and excursions, including:</span>
                </div>
                <ul className="mt-2 ml-5 flex flex-col gap-2">
                  <Bullet>The Secret Gilis</Bullet>
                  <Bullet>Waterfall treks</Bullet>
                  <Bullet>Pink Beach</Bullet>
                </ul>
              </li>
              <Bullet>
                <strong className="font-semibold text-ink">Camp outs and adventure weeks</strong> — join our regular
                overnight camp outs and themed adventure week programmes for a deeper, more immersive experience of
                Lombok&apos;s nature and culture.
              </Bullet>
            </ul>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-sand-line shadow-soft">
                <Image
                  src="/images/worldschooling-waterfall.jpg"
                  alt="Visitors climbing near a waterfall on a Lombok waterfall trek"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-sand-line shadow-soft">
                <Image
                  src="/images/worldschooling-pinkbeach.jpg"
                  alt="A visitor walking along the pink sand at Pink Beach, Lombok"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-sand-line shadow-soft">
                <Image
                  src="/images/worldschooling-campout.jpg"
                  alt="Children pitching a tent together on the beach during a camp out"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Reveal>

        <hr className="w-full border-t border-sand-line" />

        {/* Continuing the Programme While You Travel */}
        <Reveal>
          <div>
            <p className="font-script text-3xl text-orange-deep md:text-4xl">Stay connected</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">Continuing the Programme While You Travel</h3>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
              Moving on to your next destination doesn&apos;t have to mean leaving Selong Bay behind. Families can stay
              connected to us on the road through our online homeschooling programme, then simply join back in with the
              physical school whenever you&apos;re next in the area.
            </p>

            <div className="mt-6 max-w-lg overflow-hidden rounded-md border border-sand-line shadow-soft">
              <Image
                src="/images/worldschooling-family-beach.jpg"
                alt="A father walking along the beach at Selong Belanak with a group of children"
                width={2000}
                height={1125}
                className="w-full"
              />
            </div>

            <h4 className="mt-8 font-display text-xl font-semibold text-ink">Choose your curriculum:</h4>
            <ul className="mt-4 flex flex-col gap-3">
              <Bullet>Follow our own unique curriculum, or</Bullet>
              <Bullet>Follow the Cambridge curriculum</Bullet>
            </ul>

            <h4 className="mt-8 font-display text-xl font-semibold text-ink">Regular online teaching sessions:</h4>
            <ul className="mt-4 flex flex-col gap-3">
              <Bullet>
                <strong className="font-semibold text-ink">Primary:</strong> one online home room session per week with a
                home room teacher
              </Bullet>
              <Bullet>
                <strong className="font-semibold text-ink">Secondary:</strong> three to six online sessions per week with
                specialist subject teachers
              </Bullet>
            </ul>

            <h4 className="mt-8 font-display text-xl font-semibold text-ink">Support for homeschooling parents:</h4>
            <ul className="mt-4 flex flex-col gap-3">
              <Bullet>Access to online resources, including downloadable worksheets</Bullet>
              <Bullet>Guidance and support on how to navigate homeschooling day-to-day</Bullet>
              <Bullet>A weekly drop-in session with teachers, available once per week per family, to ask questions and stay on track</Bullet>
            </ul>

            <p className="mt-8 text-[17px] leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">Come back anytime:</strong> When your travels bring you back to
              Lombok, your child can rejoin Selong Bay School in person whenever it suits you — there&apos;s no need to
              re-enrol or wait for a new term.
            </p>
          </div>
        </Reveal>

        <hr className="w-full border-t border-sand-line" />

        {/* Planning Your World Schooling Stay at Selong Bay */}
        <Reveal>
          <div>
            <p className="font-script text-3xl text-orange-deep md:text-4xl">Getting started</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">Planning Your World Schooling Stay at Selong Bay</h3>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
              Getting set up is simple, and we keep the process personal so we can tailor the stay to your family.
            </p>

            <div className="mt-8 flex flex-col gap-8">
              <div>
                <h4 className="font-display text-xl font-semibold text-ink">Step 1: Get in Touch and Meet Online</h4>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                  Reach out to us and we&apos;ll arrange a short online call (video or voice) to introduce our programme,
                  hear about your child&apos;s age, interests, and learning background, and answer any questions you have.
                </p>
              </div>

              <div>
                <h4 className="font-display text-xl font-semibold text-ink">Step 2: Confirm Your Dates</h4>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                  Once we&apos;ve talked through what you&apos;re looking for, we&apos;ll confirm the dates of your stay,
                  whether that&apos;s a single day, a week, or an open-ended arrangement while you&apos;re in Lombok.
                </p>
              </div>

              <div>
                <h4 className="font-display text-xl font-semibold text-ink">Step 3: Confirm Full Days or Half Days</h4>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                  Let us know whether your child will join for full school days or half days (e.g. mornings only, or
                  afternoon activities only). This helps us plan groupings and activities appropriately.
                </p>
              </div>

              <div>
                <h4 className="font-display text-xl font-semibold text-ink">Step 4: Confirm Any Additional Requirements</h4>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">A few things to sort out before arrival:</p>
                <ul className="mt-4 flex flex-col gap-3">
                  <Bullet>
                    <strong className="font-semibold text-ink">School reports:</strong> Let us know whether your child
                    needs a school report or record of learning at the end of their stay (some world schooling and
                    homeschooling families need this for their home curriculum, visa, or portfolio requirements).
                    We&apos;re happy to provide one on request.
                  </Bullet>
                  <Bullet>
                    <strong className="font-semibold text-ink">Learning goals or curriculum notes:</strong> If you&apos;re
                    following a specific curriculum or have particular learning goals, share these with us so we can align
                    activities where possible.
                  </Bullet>
                  <Bullet>
                    <strong className="font-semibold text-ink">Health, dietary, or swimming ability notes:</strong> Given
                    our beach and surf-based activities, please let us know of any allergies, medical considerations, or
                    swimming ability in advance.
                  </Bullet>
                </ul>
              </div>

              <div>
                <h4 className="font-display text-xl font-semibold text-ink">Step 5: Arrive and Settle In</h4>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">
                  On arrival, we&apos;ll do a short orientation, introduce your child to their group, and get them settled
                  into the rhythm of the school and the wider world schooling community.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div>
            <h3 className="font-display text-2xl font-semibold text-ink">Life at Selong Bay</h3>
            <p className="mt-2 text-[15px] text-ink-soft">A few more moments from our activities, camps, and community outings.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activitiesGallery.map((photo) => (
                <div key={photo.src} className="relative aspect-square w-full overflow-hidden rounded-md border border-sand-line shadow-soft">
                  <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[17px] leading-relaxed text-ink-soft">
              Have questions about world schooling at Selong Bay? Get in touch and we&apos;ll set up a time to chat.
            </p>
            <div className="mt-6">
              <Button href="/contact" variant="accent">
                Get in Touch
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
