import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema, sql } from '@/lib/db';
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
  type GuardianChildRow,
  type LessonPlanRow,
  type CurriculumUnitRow,
  type WorkSampleRow,
  type PhotoFeedRow,
  type ResourceRow,
  type LearningProfileSummaryRow,
  type InvoiceSummaryRow,
  type ClassroomAssignmentRow,
  type ClassroomSubmissionRow,
} from '@/lib/lms-data';
import { getLunchOrdersForChild, type LunchOrderSummaryRow } from '@/lib/lunch-orders';
import { weekdaysSummaryLabel } from '@/lib/lunch-calc';
import { getUpcomingOccurrencesForClass, getNotificationPref, type SessionOccurrenceRow } from '@/lib/schedule';
import {
  getCurriculumTermsForClass,
  getCurriculumTermTree,
  getProgressMapForChild,
  type CurriculumTerm,
  type CurriculumTermTree,
  type LessonProgressStatus,
} from '@/lib/curriculum';
import { formatIDR } from '@/lib/site-content';
import { formatDate } from '@/lib/admin-format';
import AccountNav from '@/components/account/AccountNav';
import ParentChildProfileCard from '@/components/account/ParentChildProfileCard';
import LunchOrderForm from '@/components/account/LunchOrderForm';
import ParentScheduleSection from '@/components/account/ParentScheduleSection';
import ParentCurriculumSection from '@/components/account/ParentCurriculumSection';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const dynamic = 'force-dynamic';

/** Renders inline instead of throwing up to the site-wide error boundary (src/app/error.tsx),
 * which strips the real message from what reaches the browser in production — same pattern as
 * BoardLoadError on the admin Family Board page. This is a logged-in parent's own page (not
 * admin), so the message is shown to them too — it's a database/schema error, never anything
 * private about another family. */
function LearningPageLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">My Children</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

interface ChildSectionData {
  child: GuardianChildRow;
  unit: CurriculumUnitRow | null;
  lessons: LessonPlanRow[];
  workSamples: WorkSampleRow[];
  photos: PhotoFeedRow[];
  resources: ResourceRow[];
  profiles: LearningProfileSummaryRow[];
  invoices: InvoiceSummaryRow[];
  classroomAssignments: ClassroomAssignmentRow[];
  classroomSubmissions: ClassroomSubmissionRow[];
  lunchOrders: LunchOrderSummaryRow[];
  occurrences: SessionOccurrenceRow[];
  notificationsEnabled: boolean;
  curriculumTerms: CurriculumTerm[];
  initialCurriculumTerm: CurriculumTermTree | null;
  initialCurriculumProgress: [number, LessonProgressStatus][];
}

export default async function ParentLearningPage() {
  try {
    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    const customerId = session.customerId;

    await ensureSchema();
    const children = customerId ? await getChildrenForGuardian(customerId) : [];
    const [lunchSettings] = (await sql`SELECT normal_price_idr, large_price_idr FROM lunch_settings WHERE id = 1`) as unknown as {
      normal_price_idr: number;
      large_price_idr: number;
    }[];
    const lunchConfigured = Boolean(lunchSettings && lunchSettings.normal_price_idr > 0 && lunchSettings.large_price_idr > 0);

    const from = todayStr();
    // Wide enough for a few weeks of Prev/Next navigation on the timetable grid, not just "this
    // week" — OccurrenceScheduleBoard groups this into per-week pages client-side.
    const to = addDaysStr(from, 56);

    const childSections: ChildSectionData[] = await Promise.all(
      children.map(async (child) => {
        const [unit, lessons, workSamples, photos, resources, profiles, invoices, classroomAssignments, classroomSubmissions, lunchOrders, occurrences, notificationsEnabled, curriculumTerms] = await Promise.all([
          getCurrentCurriculumUnit(child.class_name),
          getUpcomingLessonPlans(child.class_name, 5),
          getWorkSamplesForChild(child.id),
          getPhotoFeedForChild(child.id, child.class_name, 12),
          getResourcesForClassBand(child.class_band),
          getLearningProfilesForChild(child.id),
          getInvoicesForChild(child.id),
          getClassroomAssignmentsForClass(child.class_name, 5),
          getClassroomSubmissionsForChild(child.id),
          getLunchOrdersForChild(child.id),
          getUpcomingOccurrencesForClass(child.class_name, child.schedule_type, from, to),
          customerId ? getNotificationPref(customerId, child.id) : Promise.resolve(false),
          getCurriculumTermsForClass(child.class_name),
        ]);
        const [initialCurriculumTerm, progressMap] = curriculumTerms.length > 0
          ? await Promise.all([getCurriculumTermTree(curriculumTerms[0].id), getProgressMapForChild(child.id)])
          : [null, new Map<number, LessonProgressStatus>()];
        return {
          child, unit, lessons, workSamples, photos, resources, profiles, invoices, classroomAssignments,
          classroomSubmissions, lunchOrders, occurrences, notificationsEnabled, curriculumTerms,
          initialCurriculumTerm, initialCurriculumProgress: [...progressMap.entries()],
        };
      })
    );

    return renderLearningPage(childSections, lunchSettings ?? { normal_price_idr: 0, large_price_idr: 0 }, lunchConfigured);
  } catch (error) {
    console.error('[account/learning] failed to load', error);
    return <LearningPageLoadError error={error} />;
  }
}

function renderLearningPage(
  childSections: ChildSectionData[],
  lunchSettings: { normal_price_idr: number; large_price_idr: number },
  lunchConfigured: boolean
) {
  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/learning" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        {childSections.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">
              No children are linked to your account yet. Ask the school office to link your email to your
              child&apos;s record.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-12">
          {childSections.map(({ child, unit, lessons, workSamples, photos, resources, profiles, invoices, classroomAssignments, classroomSubmissions, lunchOrders, occurrences, notificationsEnabled, curriculumTerms, initialCurriculumTerm, initialCurriculumProgress }) => {
            const submissionByAssignment = new Map(classroomSubmissions.map((s) => [s.classroom_assignment_id, s]));

            return (
              <section key={child.id} id={`child-${child.id}`} className="scroll-mt-6">
                <ParentChildProfileCard child={child} />

                <div className="mt-6">
                  <ParentScheduleSection
                    childId={child.id}
                    title={`Schedule — ${child.class_name ?? 'No class set'}`}
                    occurrences={occurrences}
                    initialNotificationsEnabled={notificationsEnabled}
                  />
                </div>

                {curriculumTerms.length > 0 && (
                  <div className="mt-6">
                    <ParentCurriculumSection
                      childId={child.id}
                      terms={curriculumTerms}
                      initialTerm={initialCurriculumTerm}
                      initialProgress={initialCurriculumProgress}
                    />
                  </div>
                )}

                <h2 className="mt-8 font-display text-xl font-semibold text-ink">Learning</h2>

                <div className="mt-4 grid gap-6 md:grid-cols-2">
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
                      .
                    </p>
                  </div>

                  <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft md:col-span-2">
                    <h3 className="font-display text-base font-semibold text-teal-deep">Lunches</h3>
                    {lunchOrders.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-2">
                        {lunchOrders.map((lo) => (
                          <li key={lo.id} className="rounded-sm border border-sand-line px-3 py-2 text-sm">
                            {lo.own_lunch ? (
                              <span className="text-ink-soft">Bringing lunch from home (noted {formatDate(lo.created_at.slice(0, 10))}).</span>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span>
                                  <span className="font-semibold text-ink capitalize">{lo.lunch_size}</span>
                                  <span className="text-ink-soft">
                                    {' '}· {weekdaysSummaryLabel({ monday: lo.monday, tuesday: lo.tuesday, wednesday: lo.wednesday, thursday: lo.thursday, friday: lo.friday })} ·{' '}
                                    {lo.start_date && formatDate(lo.start_date)} – {lo.end_date && formatDate(lo.end_date)} · {lo.lunch_count} lunches
                                  </span>
                                </span>
                                {lo.invoice_id && (
                                  <a href={`/api/invoices/${lo.invoice_id}/pdf`} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-semibold text-teal-deep underline">
                                    Invoice #{String(lo.invoice_number).padStart(3, '0')} — {lo.invoice_status === 'paid' ? 'Paid' : formatIDR(lo.invoice_total ?? 0)}
                                  </a>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3">
                      <LunchOrderForm
                        childId={child.id}
                        defaultAllergiesNotes={child.allergies_medical_notes}
                        normalPriceIdr={lunchSettings?.normal_price_idr ?? 0}
                        largePriceIdr={lunchSettings?.large_price_idr ?? 0}
                        configured={lunchConfigured}
                      />
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
