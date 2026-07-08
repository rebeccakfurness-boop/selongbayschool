'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { activities } from '@/lib/site-content';

interface Slot {
  id: number;
  activity_slug: string;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  capacity: number;
  spots_remaining: number;
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activitySlug, setActivitySlug] = useState(activities[0].slug);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  async function loadSlots() {
    setError(null);
    try {
      const res = await fetch('/api/admin/availability');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setSlots(data.slots);
    } catch {
      setError('Could not load availability.');
    }
  }

  useEffect(() => {
    // Fetch-on-mount: loadSlots is also re-invoked after add/update/delete,
    // so it can't be replaced with a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const activity = activities.find((a) => a.slug === activitySlug);
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activitySlug,
          activityName: activity?.name ?? activitySlug,
          date,
          time,
          capacity: Number(capacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create slot');
      setDate('');
      setTime('');
      setCapacity('10');
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateCapacity(slot: Slot, newCapacity: number) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/availability/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: newCapacity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slot');
    }
  }

  async function deleteSlot(slot: Slot) {
    if (!confirm(`Remove the ${slot.activity_name} slot on ${slot.slot_date} at ${slot.slot_time}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/availability/${slot.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot');
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Add a new slot</h1>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 rounded-md border border-sand-line bg-paper p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Activity" htmlFor="av-activity">
            <select
              id="av-activity"
              value={activitySlug}
              onChange={(e) => setActivitySlug(e.target.value)}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {activities.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" htmlFor="av-date" required>
            <TextInput id="av-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time" htmlFor="av-time" required>
            <TextInput id="av-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Capacity" htmlFor="av-capacity" required>
            <TextInput id="av-capacity" type="number" min={1} required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add slot'}
            </Button>
          </div>
        </form>
      </section>

      {error && <p role="alert" className="font-semibold text-orange-deep">{error}</p>}

      <section>
        <h2 className="font-display text-2xl font-semibold text-ink">All slots</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Activity</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Date</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Time</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Capacity</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Spots left</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots?.map((slot) => (
                <tr key={slot.id} className="border-b border-sand-line/60 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{slot.activity_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{slot.slot_date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{slot.slot_time}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCapacity(slot, Math.max(0, slot.capacity - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-sand-line hover:border-teal"
                        aria-label="Decrease capacity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center tabular-nums">{slot.capacity}</span>
                      <button
                        type="button"
                        onClick={() => updateCapacity(slot, slot.capacity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-sand-line hover:border-teal"
                        aria-label="Increase capacity"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-soft">{slot.spots_remaining}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteSlot(slot)}
                      className="text-sm font-semibold text-orange-deep hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {slots && slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">No slots yet. Add one above.</td>
                </tr>
              )}
              {!slots && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
