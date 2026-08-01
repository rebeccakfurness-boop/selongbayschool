'use client';

import { useMemo, useState } from 'react';
import { TextInput } from '@/components/forms/FormField';

interface Slot {
  startIso: string;
  endIso: string;
}

const dayFormatter = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Makassar' });
const timeFormatter = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Makassar' });

function groupByDay(slots: Slot[]): { dayLabel: string; slots: Slot[] }[] {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = dayFormatter.format(new Date(slot.startIso));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slot);
  }
  return Array.from(groups.entries()).map(([dayLabel, daySlots]) => ({ dayLabel, slots: daySlots }));
}

export default function ScheduleMeetingForm({ token, slots, location }: { token: string; slots: Slot[]; location: string }) {
  const [format, setFormat] = useState<'video' | 'in_person'>('video');
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ startIso: string; meetLink: string | null } | null>(null);

  const days = useMemo(() => groupByDay(slots), [slots]);

  async function submit() {
    if (!selected || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/schedule-meeting/${token}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startIso: selected.startIso, format, bookedByName: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not book that time');
      setConfirmed({ startIso: selected.startIso, meetLink: data.meetLink ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book that time');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mt-6 rounded-md border border-teal/30 bg-teal/10 p-6">
        <p className="font-display text-lg font-semibold text-teal-deep">Meeting confirmed</p>
        <p className="mt-2 text-sm text-ink">
          {dayFormatter.format(new Date(confirmed.startIso))} at {timeFormatter.format(new Date(confirmed.startIso))} (Lombok time)
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {format === 'video'
            ? confirmed.meetLink
              ? <>Join at the scheduled time via <a href={confirmed.meetLink} className="font-semibold text-teal-deep underline">this link</a> — we&apos;ve also emailed it to you.</>
              : "We've emailed you the video call details."
            : `See you at ${location}.`}
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="mt-6 rounded-md border border-sand-line bg-paper p-6 text-sm text-ink-soft">
        No open times in the next few weeks — please contact the school directly to arrange a meeting.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormat('video')}
          className={`rounded-full px-4 py-2 text-sm font-bold ${format === 'video' ? 'bg-teal text-white' : 'bg-sand/40 text-ink-soft'}`}
        >
          Video call
        </button>
        <button
          type="button"
          onClick={() => setFormat('in_person')}
          className={`rounded-full px-4 py-2 text-sm font-bold ${format === 'in_person' ? 'bg-teal text-white' : 'bg-sand/40 text-ink-soft'}`}
        >
          In person
        </button>
      </div>
      {format === 'in_person' && <p className="mt-2 text-xs text-ink-soft">At {location}.</p>}

      <div className="mt-5 flex flex-col gap-4">
        {days.map((day) => (
          <div key={day.dayLabel}>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{day.dayLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {day.slots.map((slot) => (
                <button
                  key={slot.startIso}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={`rounded-sm border px-3 py-1.5 text-sm font-semibold ${
                    selected?.startIso === slot.startIso
                      ? 'border-teal bg-teal text-white'
                      : 'border-sand-line bg-paper text-ink hover:border-teal'
                  }`}
                >
                  {timeFormatter.format(new Date(slot.startIso))}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4">
          <div className="flex-1">
            <label htmlFor="booked-by-name" className="text-sm font-bold text-ink">Your name</label>
            <TextInput id="booked-by-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full" />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="whitespace-nowrap rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-40"
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
