'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface CalendarChild {
  id: number;
  child_full_name: string;
  child_nickname: string | null;
  class_name: string | null;
  enrolment_date: string | null;
  exit_date: string | null;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** A child with no enrolment_date on file is treated as on-site every day (better to over-show
 * than to silently hide a real child whose start date just hasn't been entered yet); a child
 * with no exit_date is presumed still enrolled going forward. */
function isOnSite(child: CalendarChild, dateKey: string): boolean {
  if (child.enrolment_date && dateKey < child.enrolment_date) return false;
  if (child.exit_date && dateKey > child.exit_date) return false;
  return true;
}

export default function FamilyCalendar({ roster }: { roster: CalendarChild[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function changeMonth(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
    setSelectedDate(null);
  }

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const onSiteByDay = useMemo(() => {
    const map = new Map<string, CalendarChild[]>();
    for (const day of cells) {
      if (day === null) continue;
      const dateKey = toDateKey(cursor.year, cursor.month, day);
      map.set(dateKey, roster.filter((c) => isOnSite(c, dateKey)));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, cursor.year, cursor.month]);

  const selectedChildren = selectedDate ? onSiteByDay.get(selectedDate) ?? [] : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-sand-line text-ink hover:border-teal"
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="font-display text-lg font-semibold text-ink">
            {MONTH_LABELS[cursor.month]} {cursor.year}
          </p>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-sand-line text-ink hover:border-teal"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} />;
            const dateKey = toDateKey(cursor.year, cursor.month, day);
            const onSite = onSiteByDay.get(dateKey) ?? [];
            const isSelected = selectedDate === dateKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`flex aspect-square flex-col items-center justify-center rounded-md text-sm font-semibold transition-colors ${
                  isSelected ? 'bg-teal text-white' : 'bg-teal/5 text-ink hover:bg-teal/15'
                }`}
              >
                <span>{day}</span>
                {onSite.length > 0 && (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-teal-deep'}`}>
                    {onSite.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
        {selectedDate ? (
          <>
            <p className="font-display text-base font-semibold text-ink">{formatDateLabel(selectedDate)}</p>
            <p className="mt-1 text-xs text-ink-soft">{selectedChildren.length} on site</p>
            <ul className="mt-3 flex flex-col gap-2">
              {selectedChildren.map((child) => (
                <li key={child.id}>
                  <Link href={`/admin/families/${child.id}`} className="text-sm font-semibold text-teal-deep hover:underline">
                    {child.child_nickname || child.child_full_name}
                  </Link>
                  {child.class_name && <span className="ml-2 text-xs text-ink-soft">{child.class_name}</span>}
                </li>
              ))}
              {selectedChildren.length === 0 && <li className="text-sm text-ink-soft">No one on site.</li>}
            </ul>
          </>
        ) : (
          <p className="text-sm text-ink-soft">Select a day to see who&apos;s on site.</p>
        )}
      </div>
    </div>
  );
}
