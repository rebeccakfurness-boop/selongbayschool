'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChildAvatar from '@/components/ChildAvatar';
import type { KioskRosterChildRow, AttendanceEventType } from '@/lib/attendance';

type ActionState = { child: KioskRosterChildRow } | null;
type ConfirmState = { childName: string; eventType: AttendanceEventType; time: string } | null;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour: 'numeric', minute: '2-digit' });
}

/** Gate kiosk daily roster — regular students only (see /kiosk/activities for activities-only
 * students). Two-tap flow per the spec: tap a student, then tap Check In or Check Out on the
 * confirmation sheet; the time-appropriate action is visually emphasized but never the only one
 * offered, since staff sometimes need to check a late arrival in during the afternoon or vice
 * versa. */
export default function KioskDailyBoard({ roster, defaultCheckIn }: { roster: KioskRosterChildRow[]; defaultCheckIn: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<ActionState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (c) => c.child_full_name.toLowerCase().includes(q) || (c.child_nickname ?? '').toLowerCase().includes(q)
    );
  }, [roster, query]);

  async function submitCheck(child: KioskRosterChildRow, eventType: AttendanceEventType) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, eventType, sessionType: 'daily' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setAction(null);
      setConfirm({ childName: child.child_nickname || child.child_full_name, eventType, time: formatTime(data.occurredAt) });
      setTimeout(() => {
        setConfirm(null);
        setQuery('');
        router.refresh();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  async function lockKiosk() {
    await fetch('/api/kiosk/lock', { method: 'POST' });
    router.push('/kiosk/unlock');
    router.refresh();
  }

  if (confirm) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${confirm.eventType === 'check_in' ? 'bg-teal' : 'bg-orange'}`}>
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/90 text-6xl text-teal-deep">✓</div>
        <p className="mt-8 font-display text-4xl font-bold text-white">{confirm.childName}</p>
        <p className="mt-3 text-2xl font-semibold text-white">
          {confirm.eventType === 'check_in' ? 'Checked in' : 'Checked out'} at {confirm.time}
        </p>
      </div>
    );
  }

  if (action) {
    const child = action.child;
    const alreadyToday = child.last_event_type;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-10">
        <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="lg" />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">{child.child_nickname || child.child_full_name}</h1>
        {alreadyToday && (
          <p className="mt-2 text-sm text-ink-soft">
            Already {child.last_event_type === 'check_in' ? 'checked in' : 'checked out'} today at{' '}
            {child.last_event_time && formatTime(child.last_event_time)}.
          </p>
        )}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

        <div className="mt-8 flex w-full max-w-md flex-col gap-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitCheck(child, 'check_in')}
            className={`rounded-md py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60 ${
              defaultCheckIn ? 'bg-teal' : 'bg-teal/70'
            }`}
          >
            Check In
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitCheck(child, 'check_out')}
            className={`rounded-md py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60 ${
              !defaultCheckIn ? 'bg-orange-deep' : 'bg-orange-deep/70'
            }`}
          >
            Check Out
          </button>
        </div>

        <button type="button" onClick={() => setAction(null)} className="mt-8 text-lg font-semibold text-ink-soft underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className={`px-6 py-6 text-center ${defaultCheckIn ? 'bg-teal' : 'bg-orange-deep'}`}>
        <p className="font-display text-2xl font-bold text-white">{defaultCheckIn ? 'Morning Check-In' : 'Afternoon Check-Out'}</p>
        <p className="mt-1 text-sm text-white/80">Tap your child&apos;s name to check in or out.</p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          autoFocus
          className="w-full rounded-md border border-sand-line bg-white px-5 py-4 text-xl text-ink shadow-soft focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {filtered.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => setAction({ child })}
              className="flex items-center gap-4 rounded-md border border-sand-line bg-paper p-4 text-left shadow-soft transition-transform active:scale-95 hover:border-teal/50"
            >
              <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="lg" />
              <div>
                <p className="font-display text-xl font-bold text-ink">{child.child_nickname || child.child_full_name}</p>
                {child.class_name && <p className="text-sm text-ink-soft">{child.class_name}</p>}
                {child.last_event_type && (
                  <p className={`mt-1 text-xs font-bold ${child.last_event_type === 'check_in' ? 'text-teal-deep' : 'text-orange-deep'}`}>
                    {child.last_event_type === 'check_in' ? 'Checked in' : 'Checked out'}
                    {child.last_event_time && ` · ${formatTime(child.last_event_time)}`}
                  </p>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-ink-soft">No students match &quot;{query}&quot;.</p>}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 flex gap-3">
        <a href="/kiosk/activities" className="rounded-full border border-sand-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft shadow-soft hover:border-teal/40">
          Activity check-in
        </a>
        <button type="button" onClick={lockKiosk} className="rounded-full border border-sand-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft shadow-soft hover:border-teal/40">
          Lock kiosk
        </button>
      </div>
    </div>
  );
}
