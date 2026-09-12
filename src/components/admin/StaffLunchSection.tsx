'use client';

import { useEffect, useMemo, useState } from 'react';
import { TextArea } from '@/components/forms/FormField';
import { countLunchDays, type LunchWeekdays } from '@/lib/lunch-calc';
import { formatDate } from '@/lib/admin-format';

interface StaffLunchOrder {
  id: number;
  own_lunch: boolean;
  start_date: string | null;
  end_date: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  lunch_size: 'normal' | 'large' | null;
  food_preference: string | null;
  allergies_notes: string | null;
  lunch_count: number | null;
  created_at: string;
}

function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

/** Same self-fetch pattern as the other Staff Card sections -- no invoicing (see
 * staff_lunch_orders' own schema comment), so this is simpler than the parent LunchOrderForm: no
 * price, no checkout, just a request the school's kitchen fulfils. */
export default function StaffLunchSection({ adminUserId }: { adminUserId: number }) {
  const [orders, setOrders] = useState<StaffLunchOrder[] | null>(null);
  const [mode, setMode] = useState<'idle' | 'order'>('idle');
  const [startDate, setStartDate] = useState(nextMonday());
  const [endDate, setEndDate] = useState('');
  const [weekdays, setWeekdays] = useState<LunchWeekdays>({ monday: true, tuesday: true, wednesday: true, thursday: true, friday: true });
  const [lunchSize, setLunchSize] = useState<'normal' | 'large'>('normal');
  const [foodPreference, setFoodPreference] = useState('');
  const [allergiesNotes, setAllergiesNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lunchCount = useMemo(() => (endDate ? countLunchDays(startDate, endDate, weekdays) : 0), [startDate, endDate, weekdays]);

  async function load() {
    const res = await fetch(`/api/admin/staff/${adminUserId}/lunch`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setOrders(data.orders);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/staff/${adminUserId}/lunch`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setOrders(data.orders);
      });
    return () => {
      cancelled = true;
    };
  }, [adminUserId]);

  function toggleDay(key: keyof LunchWeekdays) {
    setWeekdays((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submitOwnLunch() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/lunch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownLunch: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitOrder() {
    if (!endDate || lunchCount === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/lunch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, ...weekdays, lunchSize, foodPreference: foodPreference || null, allergiesNotes: allergiesNotes || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that request.');
      setMode('idle');
      setEndDate('');
      setFoodPreference('');
      setAllergiesNotes('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Lunch Requests</h2>

      {mode === 'idle' ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => setMode('order')} className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep">
            Request lunches
          </button>
          <button
            type="button"
            onClick={submitOwnLunch}
            disabled={submitting}
            className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-bold text-ink hover:border-teal disabled:opacity-40"
          >
            {submitting ? 'Saving…' : "I'll bring my own lunch"}
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-sand-line bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="staff-lunch-start" className="text-xs font-bold uppercase tracking-wide text-ink-soft">Start date</label>
              <input id="staff-lunch-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-sm border border-sand-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="staff-lunch-end" className="text-xs font-bold uppercase tracking-wide text-ink-soft">End date</label>
              <input id="staff-lunch-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-sm border border-sand-line px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Days</span>
            <div className="mt-1 flex flex-wrap gap-3">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-sm capitalize">
                  <input type="checkbox" checked={weekdays[key]} onChange={() => toggleDay(key)} className="h-4 w-4" />
                  {key}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Size</span>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="staff-lunch-size" checked={lunchSize === 'normal'} onChange={() => setLunchSize('normal')} /> Normal
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="staff-lunch-size" checked={lunchSize === 'large'} onChange={() => setLunchSize('large')} /> Large
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="staff-lunch-pref" className="text-xs font-bold uppercase tracking-wide text-ink-soft">Food preferences</label>
            <TextArea id="staff-lunch-pref" rows={2} value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)} className="mt-1 w-full" />
          </div>
          <div className="mt-4">
            <label htmlFor="staff-lunch-allergies" className="text-xs font-bold uppercase tracking-wide text-ink-soft">Allergies / intolerances</label>
            <TextArea id="staff-lunch-allergies" rows={2} value={allergiesNotes} onChange={(e) => setAllergiesNotes(e.target.value)} className="mt-1 w-full" />
          </div>
          {endDate && <p className="mt-3 text-sm text-ink-soft">{lunchCount} lunch{lunchCount === 1 ? '' : 'es'} in that range.</p>}
          {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || lunchCount === 0}
              className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-40"
            >
              {submitting ? 'Saving…' : 'Submit request'}
            </button>
            <button type="button" onClick={() => setMode('idle')} className="text-sm font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {orders?.map((o) => (
          <li key={o.id} className="rounded-sm border border-sand-line p-3 text-sm">
            {o.own_lunch ? (
              <span className="text-ink-soft">Bringing own lunch (noted {formatDate(o.created_at.slice(0, 10))}).</span>
            ) : (
              <span>
                <span className="font-semibold capitalize text-ink">{o.lunch_size}</span>
                <span className="text-ink-soft">
                  {' '}· {o.start_date && formatDate(o.start_date)} – {o.end_date && formatDate(o.end_date)} · {o.lunch_count} lunches
                </span>
              </span>
            )}
          </li>
        ))}
        {orders?.length === 0 && <li className="text-sm text-ink-soft">No lunch requests yet.</li>}
        {orders === null && <li className="text-sm text-ink-soft">Loading…</li>}
      </ul>
    </div>
  );
}
