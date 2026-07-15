'use client';

import { useMemo, useState } from 'react';

interface CalendarSlot {
  id: number;
  slot_date: string;
  slot_time: string;
  spots_remaining: number;
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
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function BookingCalendar({
  slots,
  selectedSlotId,
  onSelectSlot,
}: {
  slots: CalendarSlot[];
  selectedSlotId: number | null;
  onSelectSlot: (id: number) => void;
}) {
  const slotsByDate = useMemo(() => {
    const map = new Map<string, CalendarSlot[]>();
    for (const slot of slots) {
      const list = map.get(slot.slot_date) ?? [];
      list.push(slot);
      map.set(slot.slot_date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.slot_time.localeCompare(b.slot_time));
    return map;
  }, [slots]);

  const initial = slots[0] ? new Date(`${slots[0].slot_date}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(
    selectedSlotId ? slots.find((s) => s.id === selectedSlotId)?.slot_date ?? null : null
  );

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function changeMonth(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function selectDay(dateKey: string, daySlots: CalendarSlot[]) {
    setSelectedDate(dateKey);
    const firstAvailable = daySlots.find((s) => s.spots_remaining > 0);
    if (firstAvailable) onSelectSlot(firstAvailable.id);
  }

  const selectedDateSlots = selectedDate ? slotsByDate.get(selectedDate) ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-sand-line text-ink hover:border-teal"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-display text-sm font-semibold text-ink">
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

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-ink-soft">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const dateKey = toDateKey(cursor.year, cursor.month, day);
          const daySlots = slotsByDate.get(dateKey) ?? [];
          const hasAvailable = daySlots.some((s) => s.spots_remaining > 0);
          const hasAny = daySlots.length > 0;
          const isSelected = selectedDate === dateKey;
          return (
            <button
              key={dateKey}
              type="button"
              disabled={!hasAvailable}
              onClick={() => selectDay(dateKey, daySlots)}
              className={`aspect-square rounded-md text-sm font-semibold transition-colors ${
                isSelected
                  ? 'bg-teal text-white'
                  : hasAvailable
                    ? 'bg-teal/10 text-teal-deep hover:bg-teal/20'
                    : hasAny
                      ? 'cursor-not-allowed bg-black/5 text-ink-soft/50 line-through'
                      : 'text-ink-soft/30'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && selectedDateSlots.length > 0 && (
        <div className="mt-4 border-t border-sand-line pt-4">
          <p className="text-sm font-semibold text-ink">{formatDateLabel(selectedDate)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedDateSlots.map((slot) => {
              const full = slot.spots_remaining <= 0;
              const selected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={full}
                  onClick={() => onSelectSlot(slot.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    full
                      ? 'cursor-not-allowed border-black/10 bg-black/5 text-ink-soft/50 line-through'
                      : selected
                        ? 'border-teal bg-teal text-white'
                        : 'border-sand-line bg-white text-ink hover:border-teal'
                  }`}
                >
                  {slot.slot_time}
                  {!full && <span className="ml-1 font-normal opacity-70">({slot.spots_remaining} left)</span>}
                  {full && <span className="ml-1 font-normal">(Full)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
