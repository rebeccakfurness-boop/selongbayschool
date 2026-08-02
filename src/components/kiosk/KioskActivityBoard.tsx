'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChildAvatar from '@/components/ChildAvatar';
import KioskSignStep from '@/components/kiosk/KioskSignStep';
import type { ActivityOption, AttendanceEventType, KioskRosterChildRow } from '@/lib/attendance';

type RosterChild = Omit<KioskRosterChildRow, 'last_event_type' | 'last_event_time'>;
type SigningState = AttendanceEventType | null;
type ConfirmState = { childName: string; activityName: string; eventType: AttendanceEventType; time: string } | null;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour: 'numeric', minute: '2-digit' });
}

/** Kept distinct from the daily gate roster (/kiosk) — a separate three-step flow (pick activity,
 * pick student, pick check in/out) rather than folded into the same screen, since this is a much
 * less frequent action than the twice-daily gate rush and mixing the two rosters would slow both
 * down. Every child (regular or activities-only) can appear here — see getActivityKioskRoster. */
export default function KioskActivityBoard({ roster, activities }: { roster: RosterChild[]; activities: ActivityOption[] }) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityOption | null>(null);
  const [query, setQuery] = useState('');
  const [child, setChild] = useState<RosterChild | null>(null);
  const [signing, setSigning] = useState<SigningState>(null);
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

  async function submitCheck(eventType: AttendanceEventType, signedByName: string, signatureDataUrl: string) {
    if (!activity || !child) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, eventType, sessionType: 'activity', activityId: activity.id, signedByName, signatureDataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setChild(null);
      setSigning(null);
      setConfirm({ childName: child.child_nickname || child.child_full_name, activityName: activity.name, eventType, time: formatTime(data.occurredAt) });
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

  if (confirm) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${confirm.eventType === 'check_in' ? 'bg-teal' : 'bg-orange'}`}>
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/90 text-6xl text-teal-deep">✓</div>
        <p className="mt-8 font-display text-4xl font-bold text-white">{confirm.childName}</p>
        <p className="mt-3 text-2xl font-semibold text-white">
          {confirm.eventType === 'check_in' ? 'Checked in to' : 'Checked out of'} {confirm.activityName} at {confirm.time}
        </p>
      </div>
    );
  }

  if (activity && child && signing) {
    return (
      <KioskSignStep
        childName={child.child_nickname || child.child_full_name}
        actionLabel={signing === 'check_in' ? 'Check In' : 'Check Out'}
        submitting={submitting}
        error={error}
        onBack={() => {
          setSigning(null);
          setError(null);
        }}
        onConfirm={(signedByName, signatureDataUrl) => submitCheck(signing, signedByName, signatureDataUrl)}
      />
    );
  }

  if (activity && child) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-10">
        <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="lg" />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">{child.child_nickname || child.child_full_name}</h1>
        <p className="mt-1 text-lg text-ink-soft">{activity.name}</p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-4">
          <button type="button" onClick={() => setSigning('check_in')} className="rounded-md bg-teal py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95">
            Check In
          </button>
          <button type="button" onClick={() => setSigning('check_out')} className="rounded-md bg-orange-deep py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95">
            Check Out
          </button>
        </div>

        <button type="button" onClick={() => setChild(null)} className="mt-8 text-lg font-semibold text-ink-soft underline">
          Back to student list
        </button>
      </div>
    );
  }

  if (activity) {
    return (
      <div className="min-h-screen bg-cream pb-16">
        <div className="bg-teal-deep px-6 py-6 text-center">
          <p className="font-display text-2xl font-bold text-white">{activity.name}</p>
          <p className="mt-1 text-sm text-white/80">Tap the student checking in or out.</p>
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
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChild(c)}
                className="flex items-center gap-4 rounded-md border border-sand-line bg-paper p-4 text-left shadow-soft transition-transform active:scale-95 hover:border-teal/50"
              >
                <ChildAvatar photoUrl={c.photo_url} name={c.child_full_name} size="lg" />
                <div>
                  <p className="font-display text-xl font-bold text-ink">{c.child_nickname || c.child_full_name}</p>
                  {c.class_name && <p className="text-sm text-ink-soft">{c.class_name}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="col-span-full py-8 text-center text-ink-soft">No students match &quot;{query}&quot;.</p>}
          </div>
        </div>
        <div className="fixed bottom-4 right-4">
          <button type="button" onClick={() => setActivity(null)} className="rounded-full border border-sand-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft shadow-soft hover:border-teal/40">
            Change activity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="bg-teal-deep px-6 py-6 text-center">
        <p className="font-display text-2xl font-bold text-white">Activity Check-In</p>
        <p className="mt-1 text-sm text-white/80">Choose the activity.</p>
      </div>
      <div className="mx-auto max-w-2xl px-6 py-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {activities.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setActivity(a)}
              className="rounded-md border border-sand-line bg-paper p-6 text-center text-xl font-bold text-ink shadow-soft transition-transform active:scale-95 hover:border-teal/50"
            >
              {a.name}
            </button>
          ))}
          {activities.length === 0 && <p className="col-span-full py-8 text-center text-ink-soft">No activities are set up yet.</p>}
        </div>
      </div>
      <div className="fixed bottom-4 right-4">
        <a href="/kiosk" className="rounded-full border border-sand-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft shadow-soft hover:border-teal/40">
          Back to gate check-in
        </a>
      </div>
    </div>
  );
}
