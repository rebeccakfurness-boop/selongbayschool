'use client';

import { useMemo, useState } from 'react';
import type { SessionOccurrenceRow } from '@/lib/schedule';
import { DAY_ORDER, DAY_LABELS, type DayOfWeek } from '@/lib/class-schedule';
import { SCHOOL_TIMEZONE_LABEL, formatSchoolTime, formatViewerTime } from '@/lib/academic-calendar';
import { colorForSubject } from '@/lib/schedule-colors';
import ParentStudentWorksheetSection from '@/components/worksheets/ParentStudentWorksheetSection';

function formatOccurrenceDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateStr}T00:00:00Z`)
  );
}

const DAY_TO_OFFSET: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/** The Monday (as "YYYY-MM-DD") of the calendar week a given occurrence falls in — the key used
 * to group occurrences into one grid ("this week") at a time, with Prev/Next to move between
 * weeks that actually have sessions in them. */
function mondayKeyFor(occurrence: SessionOccurrenceRow): string {
  const d = new Date(`${occurrence.occurrence_date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - DAY_TO_OFFSET[occurrence.day_of_week]);
  return d.toISOString().slice(0, 10);
}

/** "9:00 AM"-style school-local time isn't sortable as a string (AM/PM), so rows are ordered by
 * this separate 24-hour rendering instead — display still uses formatSchoolTime(). */
function schoolClock24(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Makassar' }).format(
    new Date(iso)
  );
}

function weekRangeLabel(mondayKey: string, daysPresent: DayOfWeek[]): string {
  const monday = new Date(`${mondayKey}T00:00:00Z`);
  const lastOffset = daysPresent.length > 0 ? Math.max(...daysPresent.map((d) => DAY_TO_OFFSET[d])) : 4;
  const last = new Date(monday);
  last.setUTCDate(last.getUTCDate() + lastOffset);
  const fmt = (d: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
  return `${fmt(monday)} – ${fmt(last)}`;
}

interface Props {
  occurrences: SessionOccurrenceRow[];
  title?: string;
  emptyMessage?: string;
  /** Shown when set — parent-only, per the spec (students don't manage the reminder toggle). */
  notifications?: {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    saving: boolean;
  };
  /** The one child this board belongs to and who's viewing it — needed to show that child's
   * worksheet/mark in the session detail modal. Omitted entirely on any future reuse of this board
   * that isn't scoped to a single child (none currently), in which case the worksheet section just
   * doesn't render. */
  worksheetContext?: { childId: number; role: 'parent' | 'student' };
}

/** Read-only weekly timetable — a Time x Day grid (like the school's own spreadsheet timetable),
 * one week at a time with Prev/Next to move between weeks, built off real dated occurrences (not
 * the raw weekly pattern) so a click always shows that specific date's teacher/lesson plan/Meet
 * link. Shows school-local (WITA) time alongside the viewer's own auto-detected local time, since
 * parents and students may be in different timezones. No edit controls here at all, hidden or
 * disabled, matching the spec's "no edit controls visible" requirement for parent/student views. */
export default function OccurrenceScheduleBoard({ occurrences, title, emptyMessage, notifications, worksheetContext }: Props) {
  const [selected, setSelected] = useState<SessionOccurrenceRow | null>(null);
  const viewerTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }, []);
  const viewerIsSchoolTimeZone = viewerTimeZone === 'Asia/Makassar';

  const weeks = useMemo(() => {
    const map = new Map<string, SessionOccurrenceRow[]>();
    for (const o of occurrences) {
      const key = mondayKeyFor(o);
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return map;
  }, [occurrences]);
  const weekKeys = useMemo(() => [...weeks.keys()].sort(), [weeks]);
  const [weekIndex, setWeekIndex] = useState(0);
  const clampedIndex = Math.min(weekIndex, Math.max(weekKeys.length - 1, 0));
  const currentWeekKey = weekKeys[clampedIndex];
  const weekOccurrences = useMemo(
    () => (currentWeekKey ? weeks.get(currentWeekKey)! : []),
    [weeks, currentWeekKey]
  );

  const daysPresent = DAY_ORDER.filter((day) => weekOccurrences.some((o) => o.day_of_week === day));

  const rows = useMemo(() => {
    const seen = new Map<string, string>(); // rowKey (24h sort key) -> display label
    for (const o of weekOccurrences) {
      const key = schoolClock24(o.starts_at);
      if (!seen.has(key)) seen.set(key, `${formatSchoolTime(o.starts_at)}–${formatSchoolTime(o.ends_at)}`);
    }
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [weekOccurrences]);

  function cellFor(day: DayOfWeek, rowKey: string): SessionOccurrenceRow | undefined {
    return weekOccurrences.find((o) => o.day_of_week === day && schoolClock24(o.starts_at) === rowKey);
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-teal-deep">{title ?? 'Weekly Schedule'}</h2>
        {notifications && (
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={notifications.enabled}
              disabled={notifications.saving}
              onChange={(e) => notifications.onToggle(e.target.checked)}
              className="h-4 w-4"
            />
            Email me reminders before each session
          </label>
        )}
      </div>
      {!viewerIsSchoolTimeZone && viewerTimeZone && (
        <p className="mt-1 text-xs text-ink-soft">
          Times shown in school time ({SCHOOL_TIMEZONE_LABEL}) and your local time ({viewerTimeZone.replace('_', ' ')}).
        </p>
      )}

      {weekKeys.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">{emptyMessage ?? 'No upcoming sessions scheduled.'}</p>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setWeekIndex((i) => Math.max(i - 1, 0))}
              disabled={clampedIndex === 0}
              className="rounded-full border border-sand-line px-3 py-1 text-sm font-semibold text-ink hover:border-teal disabled:cursor-not-allowed disabled:opacity-30"
            >
              &larr; Prev week
            </button>
            <span className="text-sm font-semibold text-ink">{weekRangeLabel(currentWeekKey, daysPresent)}</span>
            <button
              type="button"
              onClick={() => setWeekIndex((i) => Math.min(i + 1, weekKeys.length - 1))}
              disabled={clampedIndex === weekKeys.length - 1}
              className="rounded-full border border-sand-line px-3 py-1 text-sm font-semibold text-ink hover:border-teal disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next week &rarr;
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-sand-line">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-sand/40">
                  <th className="border border-sand-line px-3 py-2 text-left font-bold text-ink-soft">Time</th>
                  {daysPresent.map((day) => (
                    <th key={day} className="border border-sand-line px-3 py-2 text-center font-bold text-ink-soft">
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([rowKey, rowLabel]) => (
                  <tr key={rowKey}>
                    <td className="whitespace-nowrap border border-sand-line bg-sand/20 px-3 py-2 font-semibold text-ink-soft">
                      {rowLabel}
                    </td>
                    {daysPresent.map((day) => {
                      const cell = cellFor(day, rowKey);
                      return (
                        <td key={day} className="border border-sand-line p-0 align-top">
                          {cell ? (
                            <button
                              type="button"
                              onClick={() => setSelected(cell)}
                              style={{ backgroundColor: colorForSubject(cell.subject) }}
                              className="flex h-full w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:brightness-95"
                            >
                              <span className="font-semibold text-ink">{cell.subject}</span>
                              {cell.teacher_label && <span className="text-xs text-ink/70">{cell.teacher_label}</span>}
                            </button>
                          ) : (
                            <div className="px-3 py-2 text-center text-xs text-ink-soft">&nbsp;</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <SessionDetailModal
          occurrence={selected}
          viewerTimeZone={viewerTimeZone}
          onClose={() => setSelected(null)}
          worksheetContext={worksheetContext}
        />
      )}
    </div>
  );
}

function SessionDetailModal({
  occurrence,
  viewerTimeZone,
  onClose,
  worksheetContext,
}: {
  occurrence: SessionOccurrenceRow;
  viewerTimeZone: string | undefined;
  onClose: () => void;
  worksheetContext?: { childId: number; role: 'parent' | 'student' };
}) {
  const viewerIsSchoolTimeZone = viewerTimeZone === 'Asia/Makassar';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink">{occurrence.subject}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{formatOccurrenceDateLabel(occurrence.occurrence_date)}</p>

        <div className="mt-3 rounded-sm bg-sand/20 p-3 text-sm">
          <div>
            <span className="font-semibold text-ink">{formatSchoolTime(occurrence.starts_at)}–{formatSchoolTime(occurrence.ends_at)}</span>
            <span className="text-ink-soft"> {SCHOOL_TIMEZONE_LABEL} (school time)</span>
          </div>
          {!viewerIsSchoolTimeZone && viewerTimeZone && (
            <div className="mt-1">
              <span className="font-semibold text-ink">
                {formatViewerTime(occurrence.starts_at, viewerTimeZone)}–{formatViewerTime(occurrence.ends_at, viewerTimeZone)}
              </span>
              <span className="text-ink-soft"> your time ({viewerTimeZone.replace('_', ' ')})</span>
            </div>
          )}
        </div>

        {occurrence.teacher_label && (
          <p className="mt-3 text-sm">
            <span className="font-semibold text-ink">Teacher: </span>
            <span className="text-ink-soft">{occurrence.teacher_label}</span>
          </p>
        )}

        <p className="mt-2 text-sm">
          <span className="font-semibold text-ink">Format: </span>
          <span className="text-ink-soft">{occurrence.format === 'online' ? 'Online' : 'In person'}</span>
          {occurrence.format === 'in_person' && occurrence.location_or_link && (
            <span className="text-ink-soft"> · {occurrence.location_or_link}</span>
          )}
        </p>

        {(occurrence.format === 'online' || occurrence.meet_link) && occurrence.meet_link && (
          <a
            href={occurrence.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Join Google Meet
          </a>
        )}
        {occurrence.format === 'online' && !occurrence.meet_link && (
          <p className="mt-3 text-xs text-orange-deep">No Meet link has been added for this session yet.</p>
        )}

        {occurrence.lesson_plan_title && (
          <div className="mt-4 rounded-sm border border-sand-line p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Lesson plan</p>
            <p className="mt-1 font-semibold text-ink">{occurrence.lesson_plan_title}</p>
            {occurrence.lesson_plan_description && <p className="mt-1 text-sm text-ink-soft">{occurrence.lesson_plan_description}</p>}
          </div>
        )}

        {worksheetContext && !occurrence.is_cancelled && (
          <ParentStudentWorksheetSection
            occurrenceId={occurrence.occurrence_id}
            childId={worksheetContext.childId}
            role={worksheetContext.role}
            canUpload={occurrence.format === 'online'}
          />
        )}
      </div>
    </div>
  );
}
