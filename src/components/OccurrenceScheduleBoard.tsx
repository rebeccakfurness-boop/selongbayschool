'use client';

import { useMemo, useState } from 'react';
import type { SessionOccurrenceRow } from '@/lib/schedule';
import { SCHOOL_TIMEZONE_LABEL, formatSchoolTime, formatViewerTime } from '@/lib/academic-calendar';

function formatOccurrenceDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateStr}T00:00:00Z`)
  );
}

function groupByDate(occurrences: SessionOccurrenceRow[]): Map<string, SessionOccurrenceRow[]> {
  const map = new Map<string, SessionOccurrenceRow[]>();
  for (const o of occurrences) {
    const list = map.get(o.occurrence_date) ?? [];
    list.push(o);
    map.set(o.occurrence_date, list);
  }
  return map;
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
}

/** Read-only weekly schedule grid built off real dated occurrences (not the raw weekly pattern) —
 * shows school-local (WITA) time alongside the viewer's own auto-detected local time, since parents
 * and students may be in different timezones. Clicking a session opens its detail (teacher, lesson
 * plan, join link) rather than editing anything — there are no edit controls here at all, hidden or
 * disabled, matching the spec's "no edit controls visible" requirement for parent/student views. */
export default function OccurrenceScheduleBoard({ occurrences, title, emptyMessage, notifications }: Props) {
  const [selected, setSelected] = useState<SessionOccurrenceRow | null>(null);
  const viewerTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }, []);
  const viewerIsSchoolTimeZone = viewerTimeZone === 'Asia/Makassar';

  const byDate = groupByDate(occurrences);
  const dates = [...byDate.keys()].sort();

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-teal-deep">{title ?? 'Upcoming Sessions'}</h2>
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

      {dates.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">{emptyMessage ?? 'No upcoming sessions scheduled.'}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {dates.map((date) => (
            <div key={date}>
              <h3 className="font-display text-sm font-bold text-ink">{formatOccurrenceDateLabel(date)}</h3>
              <ul className="mt-2 flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
                {byDate.get(date)!.map((o) => (
                  <li key={o.occurrence_id}>
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="w-full rounded-sm border border-sand-line bg-cream/40 p-3 text-left transition hover:border-teal"
                    >
                      <div className="font-semibold text-ink">{o.subject}</div>
                      <div className="text-xs text-ink-soft">
                        {formatSchoolTime(o.starts_at)}–{formatSchoolTime(o.ends_at)} {SCHOOL_TIMEZONE_LABEL}
                        {!viewerIsSchoolTimeZone && viewerTimeZone && (
                          <>
                            {' '}
                            <span className="text-ink-soft/70">
                              ({formatViewerTime(o.starts_at, viewerTimeZone)}–{formatViewerTime(o.ends_at, viewerTimeZone)} your time)
                            </span>
                          </>
                        )}
                      </div>
                      {o.teacher_label && <div className="text-xs text-ink-soft">{o.teacher_label}</div>}
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          o.format === 'online' ? 'bg-teal/15 text-teal-deep' : 'bg-orange/20 text-orange-deep'
                        }`}
                      >
                        {o.format === 'online' ? 'Online' : 'In person'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <SessionDetailModal occurrence={selected} viewerTimeZone={viewerTimeZone} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SessionDetailModal({
  occurrence,
  viewerTimeZone,
  onClose,
}: {
  occurrence: SessionOccurrenceRow;
  viewerTimeZone: string | undefined;
  onClose: () => void;
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
      </div>
    </div>
  );
}
