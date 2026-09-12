import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getWeeklyScheduleForTeacher, DAY_ORDER, DAY_LABELS, type DayOfWeek } from '@/lib/class-schedule';
import { getDutyRosterForStaff, DUTY_TYPE_LABELS } from '@/lib/duty-roster';

export const dynamic = 'force-dynamic';

interface RosterItem {
  kind: 'class' | 'duty';
  startTime: string;
  endTime: string;
  title: string;
  sub: string | null;
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

/** Every staff member's own merged view -- their class_schedule rows (as a teacher) plus their
 * duty_roster rows (as any staff member), side by side per day. This is the "feeds into each
 * teacher's portal" half of the roster feature; the admin editor is at /admin/staff/roster. */
export default async function MyRosterPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const [classes, duties] = await Promise.all([
    getWeeklyScheduleForTeacher(staff.adminUserId),
    getDutyRosterForStaff(staff.adminUserId),
  ]);

  const byDay = new Map<DayOfWeek, RosterItem[]>();
  for (const day of DAY_ORDER) byDay.set(day, []);
  for (const c of classes) {
    byDay.get(c.day_of_week)!.push({
      kind: 'class',
      startTime: c.start_time,
      endTime: c.end_time,
      title: `${c.subject} · ${c.class_name}`,
      sub: c.format === 'online' ? 'Online' : c.location_or_link || 'In person',
    });
  }
  for (const d of duties) {
    byDay.get(d.day_of_week)!.push({
      kind: 'duty',
      startTime: d.start_time,
      endTime: d.end_time,
      title: DUTY_TYPE_LABELS[d.duty_type],
      sub: d.location || d.label,
    });
  }
  for (const day of DAY_ORDER) byDay.get(day)!.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const daysPresent = DAY_ORDER.filter((day) => byDay.get(day)!.length > 0);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">My Roster</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Your own weekly classes and duties — Welcome to School, break and lunch duty, CCA
        supervision, non-contact/admin time, and online teaching duty, alongside your regular
        classes.
      </p>

      {daysPresent.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
          Nothing on your roster yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {daysPresent.map((day) => (
            <div key={day} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-teal-deep">{DAY_LABELS[day]}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {byDay.get(day)!.map((item, i) => (
                  <li
                    key={i}
                    className={`rounded-sm px-2.5 py-2 text-xs ${item.kind === 'class' ? 'bg-teal/10' : 'bg-orange/10'}`}
                  >
                    <p className="font-semibold text-ink">
                      {formatTime(item.startTime)}–{formatTime(item.endTime)}
                    </p>
                    <p className={item.kind === 'class' ? 'text-teal-deep' : 'text-orange-deep'}>{item.title}</p>
                    {item.sub && <p className="text-ink-soft">{item.sub}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
