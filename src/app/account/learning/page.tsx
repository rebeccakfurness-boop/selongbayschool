import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import {
  getChildrenForGuardian,
  getUpcomingLessonPlans,
  getCurrentCurriculumUnit,
  getWorkSamplesForChild,
  getPhotoFeedForChild,
  getResourcesForClassBand,
  getLearningProfilesForChild,
  getInvoicesForChild,
  getClassroomAssignmentsForClass,
  getClassroomSubmissionsForChild,
} from '@/lib/lms-data';
import { formatIDR } from '@/lib/site-content';
import { formatDate } from '@/lib/admin-format';
import LogoutButton from '@/components/account/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ParentLearningPage() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  const customerId = session.customerId;

  await ensureSchema();
  const children = customerId ? await getChildrenForGuardian(customerId) : [];

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-black/10 bg-teal-deep">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold text-white">My Children</span>
          <div className="flex items-center gap-4">
            <Link href="/account/bookings" className="text-sm font-semibold text-white/90 hover:underline">
              My Bookings
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {children.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">
              No children are linked to your account yet. Ask the school office to link your email to your
              child&apos;s record.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-12">
          {await Promise.all(
            children.map(async (child) => {
              const [unit, lessons, workSamples, photos, resources, profiles, invoices, classroomAssignments, classroomSubmissions] = await Promise.all([
                getCurrentCurriculumUnit(child.class_name),
                getUpcomingLessonPlans(child.class_name, 5),
                getWorkSamplesForChild(child.id),
                getPhotoFeedForChild(child.id, child.class_name, 12),
                getResourcesForClassBand(child.class_band),
                getLearningProfilesForChild(child.id),
                getInvoicesForChild(child.id),
                getClassroomAssignmentsForClass(child.class_name, 5),
                getClassroomSubmissionsForChild(child.id),
              ]);
              const submissionByAssignment = new Map(classroomSubmissions.map((s) => [s.classroom_assignment_id, s]));

              return (
                <section key={child.id}>
                  <h2 className="font-display text-2xl font-semibold text-ink">
                    {child.child_nickname || child.child_full_name}
                  </h2>
                  <p className="text-sm text-ink-soft">{child.class_name || 'No class set'}</p>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Current Curriculum Unit</h3>
                      {unit ? (
                        <>
                          <p className="mt-2 font-semibold text-ink">{unit.unit_title}</p>
                          <p className="text-xs text-ink-soft">{unit.term_label}</p>
                          {unit.description && <p className="mt-2 text-sm text-ink-soft">{unit.description}</p>}
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-ink-soft">Not set yet.</p>
                      )}
                    </div>

                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Upcoming Lessons</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {lessons.map((l) => (
                          <li key={l.id} className="text-sm">
                            <span className="font-semibold text-ink">{l.title}</span>
                            <span className="ml-2 text-xs text-ink-soft">{l.week_label}{l.subject ? ` · ${l.subject}` : ''}</span>
                          </li>
                        ))}
                        {lessons.length === 0 && <li className="text-sm text-ink-soft">No lessons posted yet.</li>}
                      </ul>
                    </div>

                    {classroomAssignments.length > 0 && (
                      <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                        <h3 className="font-display text-base font-semibold text-teal-deep">Google Classroom</h3>
                        <ul className="mt-2 flex flex-col gap-2">
                          {classroomAssignments.map((a) => {
                            const submission = submissionByAssignment.get(a.id);
                            return (
                              <li key={a.id} className="text-sm">
                                <span className="font-semibold text-ink">{a.title}</span>
                                {submission && <span className="ml-2 text-xs text-teal-deep">{submission.state}</span>}
                                {a.alternate_link && (
                                  <a href={a.alternate_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-semibold text-teal-deep underline">
                                    Open
                                  </a>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Learning Profile</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {profiles.map((p) => (
                          <li key={p.id} className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-ink">{p.term_label}</span>
                            <a href={`/api/learning-profiles/${p.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                              Download PDF
                            </a>
                          </li>
                        ))}
                        {profiles.length === 0 && <li className="text-sm text-ink-soft">No term reports yet.</li>}
                      </ul>
                    </div>

                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Work Samples</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {workSamples.map((w) => (
                          <li key={w.id} className="text-sm">
                            <a href={w.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                              {w.title}
                            </a>
                            <span className="ml-2 text-xs text-ink-soft">{formatDate(w.created_at)}</span>
                          </li>
                        ))}
                        {workSamples.length === 0 && <li className="text-sm text-ink-soft">No work samples yet.</li>}
                      </ul>
                    </div>

                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft md:col-span-2">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Downloadable Resources</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {resources.map((r) => (
                          <li key={r.id} className="text-sm">
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                              {r.title}
                            </a>
                            {r.description && <span className="ml-2 text-xs text-ink-soft">{r.description}</span>}
                          </li>
                        ))}
                        {resources.length === 0 && <li className="text-sm text-ink-soft">No resources posted yet.</li>}
                      </ul>
                    </div>

                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft md:col-span-2">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Photo Feed</h3>
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {photos.map((p) => (
                          <div key={p.id} className="relative aspect-square overflow-hidden rounded-md border border-sand-line">
                            <Image src={p.file_url} alt={p.caption || ''} fill sizes="150px" className="object-cover" />
                          </div>
                        ))}
                        {photos.length === 0 && <p className="col-span-full text-sm text-ink-soft">No photos yet.</p>}
                      </div>
                    </div>

                    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft md:col-span-2">
                      <h3 className="font-display text-base font-semibold text-teal-deep">Invoices</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {invoices.map((inv) => {
                          const overdue = inv.status === 'outstanding' && inv.days_overdue > 0;
                          return (
                            <li key={inv.id} className="flex items-center justify-between text-sm">
                              <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                                Invoice #{String(inv.invoice_number).padStart(3, '0')}
                              </a>
                              <span className="text-ink-soft">
                                {formatIDR(inv.total_amount)} ·{' '}
                                <span className={overdue ? 'font-bold text-orange-deep' : 'font-semibold'}>
                                  {inv.status === 'paid'
                                    ? 'Paid'
                                    : overdue
                                      ? `${inv.days_overdue} day${inv.days_overdue === 1 ? '' : 's'} overdue`
                                      : 'Outstanding'}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                        {invoices.length === 0 && <li className="text-sm text-ink-soft">No invoices yet.</li>}
                      </ul>
                      <p className="mt-3 text-xs text-ink-soft">
                        Activities can be booked at{' '}
                        <Link href="/activities" className="font-semibold text-teal-deep underline">
                          /activities
                        </Link>
                        . Lunch selection is coming in a later phase.
                      </p>
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
