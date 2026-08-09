import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import {
  getUpcomingLessonPlans,
  getWorkSamplesForChild,
  getResourcesForClassBand,
  getClassroomAssignmentsForClass,
  getClassroomSubmissionsForChild,
} from '@/lib/lms-data';
import { formatDate } from '@/lib/admin-format';
import StudentNav from '@/components/student/StudentNav';
import type { ClassBand } from '@/lib/family-data';

export const dynamic = 'force-dynamic';

/** Everything that used to share the /student landing page with the schedule -- moved here once
 * the schedule became the landing view, reachable via StudentNav rather than removed. */
export default async function StudentLearningPage() {
  await ensureSchema();
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());

  const [child] = (await sql`
    SELECT child_full_name, child_nickname, class_name, class_band FROM children WHERE id = ${session.childId}
  `) as unknown as { child_full_name: string; child_nickname: string | null; class_name: string | null; class_band: ClassBand | null }[];

  const [lessons, workSamples, resources, classroomAssignments, classroomSubmissions] = await Promise.all([
    getUpcomingLessonPlans(child?.class_name ?? null, 5),
    session.childId ? getWorkSamplesForChild(session.childId) : Promise.resolve([]),
    getResourcesForClassBand(child?.class_band ?? null),
    getClassroomAssignmentsForClass(child?.class_name ?? null, 5),
    session.childId ? getClassroomSubmissionsForChild(session.childId) : Promise.resolve([]),
  ]);
  const submissionByAssignment = new Map(classroomSubmissions.map((s) => [s.classroom_assignment_id, s]));

  return (
    <div className="flex min-h-screen flex-col bg-cream px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <p className="font-script text-3xl text-orange-deep">Hi {child?.child_nickname || child?.child_full_name || 'there'}!</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {child?.class_name ? `${child.class_name} · ` : ''}Work &amp; Resources
          </h1>
        </div>

        <StudentNav active="/student/learning" />

        <div className="mt-6 flex flex-col gap-6">
          {classroomAssignments.length > 0 && (
            <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-teal-deep">Google Classroom</h2>
              <ul className="mt-3 flex flex-col gap-2">
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

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-teal-deep">Upcoming Lessons</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {lessons.map((l) => (
                <li key={l.id} className="text-sm">
                  <span className="font-semibold text-ink">{l.title}</span>
                  <span className="ml-2 text-xs text-ink-soft">{l.week_label}{l.subject ? ` · ${l.subject}` : ''}</span>
                </li>
              ))}
              {lessons.length === 0 && <li className="text-sm text-ink-soft">No lessons posted yet.</li>}
            </ul>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-teal-deep">My Work Samples</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {workSamples.map((w) => (
                <li key={w.id} className="text-sm">
                  <a href={w.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                    {w.title}
                  </a>
                  <span className="ml-2 text-xs text-ink-soft">{formatDate(w.created_at)}</span>
                </li>
              ))}
              {workSamples.length === 0 && <li className="text-sm text-ink-soft">Nothing uploaded yet.</li>}
            </ul>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-teal-deep">Resources</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {resources.map((r) => (
                <li key={r.id} className="text-sm">
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                    {r.title}
                  </a>
                </li>
              ))}
              {resources.length === 0 && <li className="text-sm text-ink-soft">No resources posted yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
