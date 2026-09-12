import Link from 'next/link';
import type { ChildOnlineScheduleSlotWithLesson } from '@/lib/online-learning';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABEL: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function todayKey(): string {
  return DAY_ORDER[(new Date().getDay() + 6) % 7];
}

/** A weekly (not dated) timetable of a child's online-learning slots -- no server component here
 * needs client state, since clicking a slot is a plain link straight to whichever lesson it
 * currently resolves to (see getChildOnlineScheduleWithNextLessons). Shared by the student and
 * parent portals; buildLessonHref lets the parent version carry its childId query param the same
 * way CurriculumDashboardView's buildOnlineHref already does. */
export default function OnlineLearningScheduleBoard({
  slots,
  buildLessonHref,
}: {
  slots: ChildOnlineScheduleSlotWithLesson[];
  buildLessonHref: (lessonId: number) => string;
}) {
  if (slots.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-sand-line bg-paper/60 p-6 text-center text-sm text-ink-soft">
        No weekly online lessons scheduled yet -- ask your teacher to set up your timetable.
      </p>
    );
  }

  const today = todayKey();
  const byDay = new Map<string, ChildOnlineScheduleSlotWithLesson[]>();
  for (const s of slots) {
    (byDay.get(s.day_of_week) ?? byDay.set(s.day_of_week, []).get(s.day_of_week)!).push(s);
  }

  return (
    <div className="flex flex-col gap-3">
      {DAY_ORDER.filter((d) => byDay.has(d)).map((day) => (
        <div key={day} className={`rounded-md border p-4 ${day === today ? 'border-teal bg-teal/5' : 'border-sand-line bg-paper'}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            {DAY_LABEL[day]}
            {day === today && <span className="ml-2 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-white">Today</span>}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {byDay.get(day)!.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line bg-white px-3 py-2">
                <div>
                  <p className="text-xs text-ink-soft">
                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </p>
                  <p className="font-semibold text-ink">{s.label || s.subject}</p>
                </div>
                {s.nextLesson ? (
                  <Link
                    href={buildLessonHref(s.nextLesson.lessonId)}
                    className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-deep"
                  >
                    {s.nextLesson.allCompleted ? 'Revisit lesson →' : 'Start this lesson →'}
                  </Link>
                ) : (
                  <span className="text-xs text-ink-soft">Nothing published yet</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
