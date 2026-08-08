import { DAY_LABELS, DAY_ORDER, type ClassScheduleRow } from '@/lib/class-schedule';

function formatTime(t: string): string {
  return t.slice(0, 5);
}

/** The "main screen" weekly timetable shown on the parent and student portals — subject, teacher,
 * time, and online/in-person for every class in the child's/student's own class_name. Read-only;
 * managed from /admin/teaching/schedule. */
export default function WeeklyScheduleBoard({ entries, title }: { entries: ClassScheduleRow[]; title?: string }) {
  const days = DAY_ORDER.filter((day) => entries.some((e) => e.day_of_week === day));

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-teal-deep">{title ?? 'This Week'}</h2>
      {days.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">No weekly schedule has been set for this class yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <div key={day} className="rounded-sm border border-sand-line bg-cream/40 p-3">
              <h3 className="font-display text-sm font-bold text-ink">{DAY_LABELS[day]}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {entries
                  .filter((e) => e.day_of_week === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((e) => (
                    <li key={e.id} className="text-sm">
                      <div className="font-semibold text-ink">{e.subject}</div>
                      <div className="text-xs text-ink-soft">
                        {formatTime(e.start_time)}–{formatTime(e.end_time)}
                        {e.teacher_label && ` · ${e.teacher_label}`}
                      </div>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          e.format === 'online' ? 'bg-teal/15 text-teal-deep' : 'bg-orange/20 text-orange-deep'
                        }`}
                      >
                        {e.format === 'online' ? 'Online' : 'In person'}
                      </span>
                      {e.format === 'online' && e.location_or_link && (
                        <a
                          href={e.location_or_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-[11px] font-semibold text-teal-deep underline"
                        >
                          Join link
                        </a>
                      )}
                      {e.format === 'in_person' && e.location_or_link && (
                        <span className="ml-2 text-[11px] text-ink-soft">{e.location_or_link}</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
