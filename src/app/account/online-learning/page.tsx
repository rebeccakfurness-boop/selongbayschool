import Link from 'next/link';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { getChildrenForGuardian } from '@/lib/lms-data';
import { getChildOnlineProgrammeTerms, getChildOnlineScheduleWithNextLessons } from '@/lib/online-learning';
import AccountNav from '@/components/account/AccountNav';
import OnlineLearningScheduleBoard from '@/components/curriculum/OnlineLearningScheduleBoard';

export const dynamic = 'force-dynamic';

export default async function AccountOnlineLearningPage() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  const customerId = session.customerId;

  await ensureSchema();
  const children = customerId ? await getChildrenForGuardian(customerId) : [];
  const enabledChildren = children.filter((c) => c.online_learning_enabled);

  const childSections = await Promise.all(
    enabledChildren.map(async (child) => {
      const [schedule, programme] = await Promise.all([
        getChildOnlineScheduleWithNextLessons(child.id),
        getChildOnlineProgrammeTerms(child.id),
      ]);
      return { child, schedule, programme };
    })
  );

  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/online-learning" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Online Learning</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Your child&apos;s self-directed online programme and weekly timetable. You can watch their progress here,
          or open a lesson yourself to complete it alongside (or on behalf of) them -- anything they can do, you can
          too, from your own login.
        </p>

        {childSections.length === 0 && (
          <div className="mt-6 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">
              None of your children have online learning turned on yet. Ask the school office or your child&apos;s
              teacher if you&apos;d like this set up.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-10">
          {childSections.map(({ child, schedule, programme }) => (
            <section key={child.id}>
              <h2 className="font-display text-xl font-semibold text-ink">{child.child_nickname || child.child_full_name}</h2>
              <p className="text-xs text-ink-soft">{child.class_name ?? 'No class set'}</p>

              <div className="mt-4">
                <OnlineLearningScheduleBoard slots={schedule} buildLessonHref={(lessonId) => `/account/learning/lesson/${lessonId}?childId=${child.id}`} />
              </div>

              {programme.length > 0 && (
                <div className="mt-4 rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                  <h3 className="font-display text-base font-semibold text-teal-deep">Programme</h3>
                  <ul className="mt-2 flex flex-col gap-1">
                    {programme.map((t) => (
                      <li key={t.id} className="text-sm text-ink-soft">
                        <span className="font-semibold text-ink">{t.subject}</span> · {t.term_label}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/account/learning#child-${child.id}`} className="mt-3 inline-block text-sm font-semibold text-teal-deep hover:underline">
                    Browse the full curriculum and progress →
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
