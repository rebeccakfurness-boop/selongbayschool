import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import {
  getWeeklyScheduleForTeacher,
  getWeeklyScheduleForClasses,
  DAY_ORDER,
  DAY_LABELS,
  SCHOOL_AREAS,
  type DayOfWeek,
  type ClassScheduleRow,
} from '@/lib/class-schedule';
import { getDutyRosterForStaff, getSchoolWideDutyRoster, DUTY_TYPE_LABELS, type DutyRosterRow } from '@/lib/duty-roster';

export const dynamic = 'force-dynamic';

function formatTime(t: string): string {
  return t.slice(0, 5);
}

/** Groups any list of day/start_time/end_time rows into a Time-rows x Day-columns grid: which
 * days actually have something on them, the distinct (start, end) slots across all of them
 * (sorted), and a lookup for everything in one cell -- shared by the Grand Roster and the three
 * area rosters below, since both are "same time slot shape, different row content". */
function buildTimeDayGrid<T extends { day_of_week: DayOfWeek; start_time: string; end_time: string }>(items: T[]) {
  const daysPresent = DAY_ORDER.filter((day) => items.some((i) => i.day_of_week === day));
  const slotLabels = new Map<string, string>();
  for (const i of items) {
    const key = `${i.start_time}|${i.end_time}`;
    if (!slotLabels.has(key)) slotLabels.set(key, `${formatTime(i.start_time)}–${formatTime(i.end_time)}`);
  }
  const slots = [...slotLabels.entries()].sort(([a], [b]) => a.localeCompare(b));
  function cellItems(day: DayOfWeek, slotKey: string): T[] {
    return items.filter((i) => i.day_of_week === day && `${i.start_time}|${i.end_time}` === slotKey);
  }
  return { daysPresent, slots, cellItems };
}

function GrandRosterCell({ items }: { items: DutyRosterRow[] }) {
  const byType = new Map<string, string[]>();
  for (const i of items) {
    const existing = byType.get(i.duty_type);
    if (existing) existing.push(i.staff_label);
    else byType.set(i.duty_type, [i.staff_label]);
  }
  if (byType.size === 0) return <>&nbsp;</>;
  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 text-xs">
      {[...byType.entries()].map(([dutyType, staffLabels]) => (
        <div key={dutyType}>
          <p className="font-semibold text-teal-deep">{DUTY_TYPE_LABELS[dutyType as keyof typeof DUTY_TYPE_LABELS] ?? dutyType}</p>
          <p className="text-ink-soft">{staffLabels.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

function AreaRosterCell({ items }: { items: ClassScheduleRow[] }) {
  if (items.length === 0) return <>&nbsp;</>;
  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 text-xs">
      {items.map((c) => (
        <div key={c.id}>
          <p className="font-semibold text-ink">{c.class_name} · {c.subject}</p>
          <p className="text-ink-soft">
            {c.teacher_label || 'No teacher set'}
            {c.format === 'online' ? ' · Online' : c.location_or_link ? ` · ${c.location_or_link}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

function WeeklyGrid<T extends { day_of_week: DayOfWeek; start_time: string; end_time: string }>({
  items,
  emptyMessage,
  renderCell,
}: {
  items: T[];
  emptyMessage: string;
  renderCell: (cellItems: T[]) => React.ReactNode;
}) {
  const { daysPresent, slots, cellItems } = buildTimeDayGrid(items);
  if (slots.length === 0) {
    return <p className="mt-3 text-sm text-ink-soft">{emptyMessage}</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-sand-line">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-sand/40">
            <th className="border border-sand-line px-3 py-2 text-left font-bold text-ink-soft">Time</th>
            {daysPresent.map((day) => (
              <th key={day} className="border border-sand-line px-3 py-2 text-left font-bold text-ink-soft">
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map(([slotKey, slotLabel]) => (
            <tr key={slotKey}>
              <td className="whitespace-nowrap border border-sand-line bg-sand/20 px-3 py-2 align-top font-semibold text-ink-soft">
                {slotLabel}
              </td>
              {daysPresent.map((day) => (
                <td key={day} className="border border-sand-line p-0 align-top">
                  {renderCell(cellItems(day, slotKey))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PersonalRosterItem {
  kind: 'class' | 'duty';
  startTime: string;
  endTime: string;
  title: string;
  sub: string | null;
}

/** Every staff member's view of the school's rosters -- the Grand Roster (Welcome to School,
 * play break, lunch, and CCAs, whole-school), a roster for each area (Kindergarten, Primary,
 * Secondary), and their own personal weekly classes and duties. All of it is admin-set: the
 * Grand Roster and area rosters are read straight from the same Duty Roster and Class Schedule
 * data the admin editors at /admin/staff/roster and /admin/teaching/schedule maintain -- this
 * page has no editing of its own. */
export default async function MyRosterPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const [grandRoster, areaSchedules, classes, duties] = await Promise.all([
    getSchoolWideDutyRoster(),
    Promise.all(SCHOOL_AREAS.map((area) => getWeeklyScheduleForClasses(area.classes))),
    getWeeklyScheduleForTeacher(staff.adminUserId),
    getDutyRosterForStaff(staff.adminUserId),
  ]);

  const byDay = new Map<DayOfWeek, PersonalRosterItem[]>();
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
  const personalDaysPresent = DAY_ORDER.filter((day) => byDay.get(day)!.length > 0);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">My Roster</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        The whole school&apos;s rosters, plus your own weekly classes and duties.
      </p>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Grand Roster — Whole School</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Welcome to School (8:00–8:30), play break, lunch, and CCAs — everyone on duty, across the whole school.
        </p>
        <WeeklyGrid items={grandRoster} emptyMessage="Nothing set on the whole-school roster yet." renderCell={(items) => <GrandRosterCell items={items} />} />
      </div>

      {SCHOOL_AREAS.map((area, i) => (
        <div key={area.label} className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">{area.label}</h2>
          <WeeklyGrid
            items={areaSchedules[i]}
            emptyMessage={`No weekly schedule set for ${area.label} yet.`}
            renderCell={(items) => <AreaRosterCell items={items} />}
          />
        </div>
      ))}

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Your Own Roster</h2>
        {personalDaysPresent.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            Nothing on your roster yet.
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {personalDaysPresent.map((day) => (
              <div key={day} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-teal-deep">{DAY_LABELS[day]}</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {byDay.get(day)!.map((item, idx) => (
                    <li
                      key={idx}
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
      </div>
    </section>
  );
}
