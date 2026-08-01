'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { countLunchDays, type LunchWeekdays } from '@/lib/lunch-calc';
import { formatIDR } from '@/lib/site-content';
import { TextArea } from '@/components/forms/FormField';

function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function LunchOrderForm({
  childId,
  defaultAllergiesNotes,
  normalPriceIdr,
  largePriceIdr,
  configured,
}: {
  childId: number;
  defaultAllergiesNotes: string | null;
  normalPriceIdr: number;
  largePriceIdr: number;
  configured: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'order'>('choose');
  const [startDate, setStartDate] = useState(nextMonday());
  const [endDate, setEndDate] = useState(addDays(nextMonday(), 27));
  const [weekdays, setWeekdays] = useState<LunchWeekdays>({ monday: true, tuesday: true, wednesday: true, thursday: true, friday: true });
  const [lunchSize, setLunchSize] = useState<'normal' | 'large'>('normal');
  const [foodPreference, setFoodPreference] = useState('');
  const [allergiesNotes, setAllergiesNotes] = useState(defaultAllergiesNotes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownLunchSaved, setOwnLunchSaved] = useState(false);
  const [confirmed, setConfirmed] = useState<{ lunchCount: number; totalAmount: number; invoiceId: number } | null>(null);

  const unitPrice = lunchSize === 'large' ? largePriceIdr : normalPriceIdr;
  const lunchCount = useMemo(() => countLunchDays(startDate, endDate, weekdays), [startDate, endDate, weekdays]);
  const total = lunchCount * unitPrice;

  function toggleDay(key: keyof LunchWeekdays) {
    setWeekdays((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submitOwnLunch() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/lunch-orders/own-lunch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your preference');
      setOwnLunchSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your preference');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/lunch-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, startDate, endDate, weekdays, lunchSize, foodPreference: foodPreference || null, allergiesNotes: allergiesNotes || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not place that order');
      setConfirmed({ lunchCount: data.lunchCount, totalAmount: data.totalAmount, invoiceId: data.invoiceId });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place that order');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-md border border-teal/30 bg-teal/10 p-4 text-sm">
        <p className="font-semibold text-teal-deep">
          Order confirmed — {confirmed.lunchCount} lunch{confirmed.lunchCount === 1 ? '' : 'es'}, {formatIDR(confirmed.totalAmount)}.
        </p>
        <a href={`/api/invoices/${confirmed.invoiceId}/pdf`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-teal-deep underline">
          View invoice (bank transfer details inside)
        </a>
        <p className="mt-2 text-xs text-ink-soft">A copy has also been emailed to you.</p>
      </div>
    );
  }

  if (ownLunchSaved) {
    return <p className="rounded-md border border-teal/30 bg-teal/10 p-4 text-sm font-semibold text-teal-deep">Noted — bringing lunch from home.</p>;
  }

  if (mode === 'choose') {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode('order')}
          disabled={!configured}
          className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          Order lunches
        </button>
        <button
          type="button"
          onClick={submitOwnLunch}
          disabled={submitting}
          className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-bold text-ink hover:border-teal disabled:opacity-40"
        >
          {submitting ? 'Saving…' : "I'll bring my own lunch"}
        </button>
        {!configured && <p className="w-full text-xs text-ink-soft">Lunch ordering isn&apos;t set up yet — please check back later.</p>}
        {error && <p className="w-full text-xs font-semibold text-orange-deep">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lunch-start" className="text-xs font-bold uppercase tracking-wide text-ink-soft">Start date</label>
          <input
            id="lunch-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-sm border border-sand-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="lunch-end" className="text-xs font-bold uppercase tracking-wide text-ink-soft">End date</label>
          <input
            id="lunch-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-sm border border-sand-line px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Days of the week</span>
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
        <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Lunch size</span>
        <div className="mt-1 flex flex-wrap gap-4">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="lunch-size" checked={lunchSize === 'normal'} onChange={() => setLunchSize('normal')} />
            Normal — {formatIDR(normalPriceIdr)}/lunch
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="lunch-size" checked={lunchSize === 'large'} onChange={() => setLunchSize('large')} />
            Large — {formatIDR(largePriceIdr)}/lunch
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="lunch-food-pref" className="text-xs font-bold uppercase tracking-wide text-ink-soft">Food preferences</label>
        <TextArea id="lunch-food-pref" rows={2} value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)} className="mt-1 w-full" placeholder="e.g. vegetarian, no spicy food" />
      </div>

      <div className="mt-4">
        <label htmlFor="lunch-allergies" className="text-xs font-bold uppercase tracking-wide text-ink-soft">Allergies / intolerances</label>
        <TextArea id="lunch-allergies" rows={2} value={allergiesNotes} onChange={(e) => setAllergiesNotes(e.target.value)} className="mt-1 w-full" />
      </div>

      <div className="mt-4 rounded-sm bg-sand/20 p-3 text-sm">
        <span className="font-semibold text-ink">{lunchCount} lunch{lunchCount === 1 ? '' : 'es'}</span>
        <span className="text-ink-soft"> × {formatIDR(unitPrice)} = </span>
        <span className="font-bold text-teal-deep">{formatIDR(total)}</span>
        {lunchCount === 0 && <p className="mt-1 text-xs text-orange-deep">No lunch days fall in that date range — widen it or select more days.</p>}
      </div>

      {error && <p role="alert" className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={submitOrder}
          disabled={submitting || lunchCount === 0}
          className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Placing order…' : 'Confirm & checkout'}
        </button>
        <button type="button" onClick={() => setMode('choose')} className="text-sm font-semibold text-ink-soft hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
