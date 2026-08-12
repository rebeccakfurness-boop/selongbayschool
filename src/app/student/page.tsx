import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getUpcomingOccurrencesForClass, type ScheduleType } from '@/lib/schedule';
import StudentNav from '@/components/student/StudentNav';
import OccurrenceScheduleBoard from '@/components/OccurrenceScheduleBoard';

export const dynamic = 'force-dynamic';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lands students directly on their own schedule, per the spec -- Work Samples, Resources, and
 * Classroom assignments moved to /student/learning, reachable via StudentNav rather than removed. */
export default async function StudentHomePage() {
  await ensureSchema();
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());

  const [child] = (await sql`
    SELECT child_full_name, child_nickname, class_name, schedule_type FROM children WHERE id = ${session.childId}
  `) as unknown as { child_full_name: string; child_nickname: string | null; class_name: string | null; schedule_type: ScheduleType | null }[];

  const from = todayStr();
  // Wide enough for a few weeks of Prev/Next navigation on the timetable grid, not just "this
  // week" — OccurrenceScheduleBoard groups this into per-week pages client-side.
  const to = addDaysStr(from, 56);
  const occurrences = await getUpcomingOccurrencesForClass(child?.class_name ?? null, child?.schedule_type ?? null, from, to);

  return (
    <div className="flex min-h-screen flex-col bg-cream px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <p className="font-script text-3xl text-orange-deep">Hi {child?.child_nickname || child?.child_full_name || 'there'}!</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {child?.class_name ? `${child.class_name} · ` : ''}My Schedule
          </h1>
        </div>

        <StudentNav active="/student" />

        <div className="mt-6">
          <OccurrenceScheduleBoard
            occurrences={occurrences}
            title="Your Sessions"
            emptyMessage="No sessions in the next two weeks. If term dates haven't been set up yet, check back once the school has confirmed this term's calendar."
            worksheetContext={session.childId ? { childId: session.childId, role: 'student' } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
