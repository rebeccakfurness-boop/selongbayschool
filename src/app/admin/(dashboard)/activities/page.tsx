'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { formatIDR } from '@/lib/site-content';
import PhotoUploadField from '@/components/admin/PhotoUploadField';
import CancelSessionButton from '@/components/admin/CancelSessionButton';

interface ActivityRow {
  id: number;
  slug: string;
  name: string;
  day: string | null;
  duration: string | null;
  price_idr: number | null;
  price_note: string | null;
  default_time: string | null;
  default_capacity: number;
  is_active: boolean;
  photo_url: string | null;
  description: string;
}

interface Slot {
  id: number;
  activity_slug: string;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  capacity: number;
  spots_remaining: number;
  status: string;
  booking_count: number;
}

function ActivityEditRow({ activity, onSaved }: { activity: ActivityRow; onSaved: () => void }) {
  const [name, setName] = useState(activity.name);
  const [day, setDay] = useState(activity.day ?? '');
  const [defaultTime, setDefaultTime] = useState(activity.default_time ?? '');
  const [duration, setDuration] = useState(activity.duration ?? '');
  const [description, setDescription] = useState(activity.description);
  const [priceIDR, setPriceIDR] = useState(activity.price_idr != null ? String(activity.price_idr) : '');
  const [defaultCapacity, setDefaultCapacity] = useState(String(activity.default_capacity));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function save() {
    patch({
      name,
      day,
      duration,
      description,
      priceIDR: priceIDR === '' ? null : Number(priceIDR),
      defaultTime,
      defaultCapacity: Number(defaultCapacity),
    });
  }

  return (
    <tr className={`border-b border-sand-line/60 last:border-0 align-top ${activity.is_active ? '' : 'opacity-60'}`}>
      <td className="px-3 py-2">
        <PhotoUploadField
          currentUrl={activity.photo_url}
          pathPrefix={`activities/${activity.id}`}
          onUploaded={(url) => patch({ photoUrl: url })}
        />
      </td>
      <td className="px-3 py-2"><TextInput value={name} onChange={(e) => setName(e.target.value)} className="w-40" /></td>
      <td className="px-3 py-2"><TextInput value={day} onChange={(e) => setDay(e.target.value)} className="w-28" placeholder="e.g. Tuesdays" /></td>
      <td className="px-3 py-2"><TextInput value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="w-24" placeholder="e.g. 15:00" /></td>
      <td className="px-3 py-2"><TextInput value={duration} onChange={(e) => setDuration(e.target.value)} className="w-24" placeholder="e.g. 1 hour" /></td>
      <td className="px-3 py-2">
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-56 resize-y" />
      </td>
      <td className="px-3 py-2">
        <TextInput type="number" min={0} step={1000} value={priceIDR} onChange={(e) => setPriceIDR(e.target.value)} className="w-28" />
        <div className="mt-1 text-xs font-semibold text-ink-soft">{priceIDR ? formatIDR(Number(priceIDR)) : '-'}</div>
      </td>
      <td className="px-3 py-2"><TextInput type="number" min={1} value={defaultCapacity} onChange={(e) => setDefaultCapacity(e.target.value)} className="w-16" /></td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={() => patch({ isActive: !activity.is_active })}
          disabled={saving}
          className={`rounded-full px-3 py-1 text-xs font-bold ${activity.is_active ? 'bg-teal/15 text-teal-deep' : 'bg-sand text-ink-soft'}`}
        >
          {activity.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col items-start gap-1.5">
          <Link href={`/admin/activities/${activity.id}`} className="text-xs font-semibold text-teal-deep hover:underline">
            View &rarr;
          </Link>
          <Button type="button" variant="ghost" className="px-4 py-1.5 text-xs" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {error && <div className="max-w-[10rem] text-xs font-semibold text-orange-deep">{error}</div>}
        </div>
      </td>
    </tr>
  );
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityRow[] | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activitySlug, setActivitySlug] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newDefaultTime, setNewDefaultTime] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newPriceIDR, setNewPriceIDR] = useState('');
  const [newDefaultCapacity, setNewDefaultCapacity] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  const [newAgeGroup, setNewAgeGroup] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoKey, setNewPhotoKey] = useState(() => crypto.randomUUID());
  const [addingActivity, setAddingActivity] = useState(false);
  const [addActivityError, setAddActivityError] = useState<string | null>(null);

  async function loadSlots() {
    setError(null);
    try {
      const res = await fetch('/api/admin/availability');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setSlots(data.slots);
    } catch {
      setError('Could not load sessions.');
    }
  }

  async function loadActivities() {
    try {
      const res = await fetch('/api/admin/activities');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setActivities(data.activities);
      const active = (data.activities as ActivityRow[]).filter((a) => a.is_active);
      if (active.length > 0) {
        setActivitySlug((current) => current || active[0].slug);
      }
    } catch {
      setError('Could not load activities.');
    }
  }

  useEffect(() => {
    // Fetch-on-mount: both loaders are also re-invoked after add/update/delete/cancel,
    // so they can't be replaced with a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
    loadActivities();
  }, []);

  async function handleAddActivity(e: FormEvent) {
    e.preventDefault();
    setAddingActivity(true);
    setAddActivityError(null);
    try {
      const res = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          day: newDay,
          duration: newDuration,
          priceIDR: newPriceIDR === '' ? undefined : Number(newPriceIDR),
          defaultTime: newDefaultTime,
          defaultCapacity: Number(newDefaultCapacity),
          description: newDescription,
          ageGroup: newAgeGroup,
          photoUrl: newPhotoUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create activity');
      setNewName('');
      setNewDay('');
      setNewDefaultTime('');
      setNewDuration('');
      setNewPriceIDR('');
      setNewDefaultCapacity('10');
      setNewDescription('');
      setNewAgeGroup('');
      setNewPhotoUrl('');
      setNewPhotoKey(crypto.randomUUID());
      await loadActivities();
    } catch (err) {
      setAddActivityError(err instanceof Error ? err.message : 'Failed to create activity');
    } finally {
      setAddingActivity(false);
    }
  }

  async function handleAddSession(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const activity = activities?.find((a) => a.slug === activitySlug);
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
      if (!res.ok) throw new Error(data.error || 'Failed to create session');
      setDate('');
      setTime('');
      setCapacity('10');
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
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
      setError(err instanceof Error ? err.message : 'Failed to update session');
    }
  }

  async function deleteSlot(slot: Slot) {
    if (!confirm(`Permanently remove the ${slot.activity_name} session on ${slot.slot_date} at ${slot.slot_time}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/availability/${slot.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  }

  const activeActivities = activities?.filter((a) => a.is_active) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Activities &amp; Calendar</h1>

      {error && <p role="alert" className="font-semibold text-orange-deep">{error}</p>}

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Activities</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[1150px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-3 py-3 font-bold text-ink-soft">Photo</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Name</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Day</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Time</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Duration</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Description</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Price (IDR)</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Capacity</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Active</th>
                <th className="px-3 py-3 font-bold text-ink-soft"></th>
              </tr>
            </thead>
            <tbody>
              {activities?.map((activity) => (
                <ActivityEditRow key={activity.id} activity={activity} onSaved={loadActivities} />
              ))}
              {activities && activities.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-ink-soft">No activities yet. Add one below.</td>
                </tr>
              )}
              {!activities && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-ink-soft">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Add Activity</h2>
        <form onSubmit={handleAddActivity} className="mt-4 grid gap-4 rounded-md border border-sand-line bg-paper p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" htmlFor="act-name" required>
            <TextInput id="act-name" required value={newName} onChange={(e) => setNewName(e.target.value)} />
          </Field>
          <Field label="Day" htmlFor="act-day">
            <TextInput id="act-day" value={newDay} onChange={(e) => setNewDay(e.target.value)} placeholder="e.g. Tuesdays" />
          </Field>
          <Field label="Default time" htmlFor="act-time">
            <TextInput id="act-time" value={newDefaultTime} onChange={(e) => setNewDefaultTime(e.target.value)} placeholder="e.g. 15:00" />
          </Field>
          <Field label="Duration" htmlFor="act-duration">
            <TextInput id="act-duration" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="e.g. 1 hour" />
          </Field>
          <Field label="Price (IDR)" htmlFor="act-price">
            <TextInput id="act-price" type="number" min={0} step={1000} value={newPriceIDR} onChange={(e) => setNewPriceIDR(e.target.value)} placeholder="e.g. 150000" />
          </Field>
          <Field label="Default capacity" htmlFor="act-capacity" required>
            <TextInput id="act-capacity" type="number" min={1} required value={newDefaultCapacity} onChange={(e) => setNewDefaultCapacity(e.target.value)} />
          </Field>
          <Field label="Age group" htmlFor="act-age-group">
            <TextInput id="act-age-group" value={newAgeGroup} onChange={(e) => setNewAgeGroup(e.target.value)} placeholder="e.g. Ages 5-12" />
          </Field>
          <Field label="Photo" htmlFor="act-photo">
            <PhotoUploadField
              currentUrl={newPhotoUrl || null}
              pathPrefix={`activities/${newPhotoKey}`}
              onUploaded={setNewPhotoUrl}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Description" htmlFor="act-description" required>
              <TextArea id="act-description" required rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </Field>
          </div>
          {addActivityError && <p role="alert" className="sm:col-span-2 lg:col-span-4 font-semibold text-orange-deep">{addActivityError}</p>}
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" variant="primary" disabled={addingActivity}>
              {addingActivity ? 'Adding…' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Add a new session</h2>
        <form onSubmit={handleAddSession} className="mt-4 grid gap-4 rounded-md border border-sand-line bg-paper p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Activity" htmlFor="av-activity">
            <select
              id="av-activity"
              value={activitySlug}
              onChange={(e) => setActivitySlug(e.target.value)}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {activeActivities.map((a) => (
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
              {submitting ? 'Adding…' : 'Add session'}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Upcoming sessions</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Activity</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Date</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Time</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Capacity</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Spots left</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots?.map((slot) => (
                <tr key={slot.id} className={`border-b border-sand-line/60 last:border-0 ${slot.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-ink">{slot.activity_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{slot.slot_date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{slot.slot_time}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCapacity(slot, Math.max(0, slot.capacity - 1))}
                        disabled={slot.status === 'cancelled'}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-sand-line hover:border-teal disabled:opacity-40"
                        aria-label="Decrease capacity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center tabular-nums">{slot.capacity}</span>
                      <button
                        type="button"
                        onClick={() => updateCapacity(slot, slot.capacity + 1)}
                        disabled={slot.status === 'cancelled'}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-sand-line hover:border-teal disabled:opacity-40"
                        aria-label="Increase capacity"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-soft">{slot.spots_remaining}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold capitalize ${slot.status === 'cancelled' ? 'bg-orange/20 text-orange-deep' : 'bg-teal/15 text-teal-deep'}`}>
                      {slot.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {slot.status === 'active' && (
                        <CancelSessionButton
                          sessionId={slot.id}
                          activityName={slot.activity_name}
                          date={slot.slot_date}
                          time={slot.slot_time}
                          onCancelled={loadSlots}
                        />
                      )}
                      {slot.booking_count === 0 && (
                        <button
                          type="button"
                          onClick={() => deleteSlot(slot)}
                          className="text-left text-sm font-semibold text-ink-soft hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {slots && slots.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No upcoming sessions. Add one above.</td>
                </tr>
              )}
              {!slots && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
