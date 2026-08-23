'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChildAvatar from '@/components/ChildAvatar';
import KioskSignStep from '@/components/kiosk/KioskSignStep';
import type { ActivityOption, AttendanceEventType, KioskRosterChildRow } from '@/lib/attendance';

type RosterChild = Omit<KioskRosterChildRow, 'last_event_type' | 'last_event_time'>;
type SigningState = AttendanceEventType | null;
type ConfirmState = { childId: number; eventId: number; childName: string; activityName: string; eventType: AttendanceEventType; time: string; byAdmin: boolean } | null;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour: 'numeric', minute: '2-digit' });
}

/** Kept distinct from the daily gate roster (/kiosk) — a separate three-step flow (pick activity,
 * pick student, pick check in/out) rather than folded into the same screen, since this is a much
 * less frequent action than the twice-daily gate rush and mixing the two rosters would slow both
 * down. Every child (regular or activities-only) can appear here — see getActivityKioskRoster.
 * Same two paths as the daily board: parent signs, or staff check in/out directly (admin
 * override, no signature) — /kiosk requires a staff login either way. */
export default function KioskActivityBoard({ roster, activities }: { roster: RosterChild[]; activities: ActivityOption[] }) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityOption | null>(null);
  const [query, setQuery] = useState('');
  const [child, setChild] = useState<RosterChild | null>(null);
  const [signing, setSigning] = useState<SigningState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const timer = setTimeout(() => {
      setConfirm(null);
      setQuery('');
      router.refresh();
    }, 6000);
    return () => clearTimeout(timer);
  }, [confirm, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (c) => c.child_full_name.toLowerCase().includes(q) || (c.child_nickname ?? '').toLowerCase().includes(q)
    );
  }, [roster, query]);

  function resetToList() {
    setConfirm(null);
    setQuery('');
    router.refresh();
  }

  async function submitSigned(eventType: AttendanceEventType, signedByName: string, signatureDataUrl: string) {
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
      setConfirm({ childId: child.id, eventId: data.id, childName: child.child_nickname || child.child_full_name, activityName: activity.name, eventType, time: formatTime(data.occurredAt), byAdmin: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAdminCheck(eventType: AttendanceEventType) {
    if (!activity || !child) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, eventType, sessionType: 'activity', activityId: activity.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setChild(null);
      setConfirm({ childId: child.id, eventId: data.id, childName: child.child_nickname || child.child_full_name, activityName: activity.name, eventType, time: formatTime(data.occurredAt), byAdmin: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  async function undoEvent(childId: number, eventId: number) {
    setUndoing(true);
    try {
      await fetch(`/api/admin/children/${childId}/attendance/${eventId}`, { method: 'DELETE' });
    } finally {
      setUndoing(false);
      resetToList();
    }
  }

  if (confirm) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${confirm.eventType === 'check_in' ? 'bg-teal' : 'bg-orange'}`}>
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/90 text-6xl text-teal-deep">✓</div>
        <p className="mt-8 font-display text-4xl font-bold text-white">{confirm.childName}</p>
        <p className="mt-3 text-2xl font-semibold text-white">
          {confirm.eventType === 'check_in' ? 'Checked in to' : 'Checked out of'} {confirm.activityName} at {confirm.time}
          {confirm.byAdmin && ' (admin)'}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={undoing}
            onClick={() => undoEvent(confirm.childId, confirm.eventId)}
            className="rounded-full border-2 border-white/70 px-6 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {undoing ? 'Undoing…' : 'Undo (made a mistake)'}
          </button>
          <button type="button" onClick={resetToList} className="text-sm font-semibold text-white/80 underline">
            Done
          </button>
        </div>
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
        onConfirm={(signedByName, signatureDataUrl) => submitSigned(signing, signedByName, signatureDataUrl)}
      />
    );
  }

  if (activity && child) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-10">
        <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="lg" />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">{child.child_nickname || child.child_full_name}</h1>
        <p className="mt-1 text-lg text-ink-soft">{activity.name}</p>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

        <p className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-soft">Parent signs</p>
        <div className="mt-2 flex w-full max-w-md flex-col gap-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setSigning('check_in')}
            className="rounded-md bg-teal py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60"
          >
            Check In
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => setSigning('check_out')}
            className="rounded-md bg-orange-deep py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60"
          >
            Check Out
          </button>
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-soft">Or, staff check in without a signature</p>
        <div className="mt-2 flex w-full max-w-md gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitAdminCheck('check_in')}
            className="flex-1 rounded-md border-2 border-teal py-3 text-base font-bold text-teal-deep transition-transform active:scale-95 disabled:opacity-60"
          >
            Admin Check In
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitAdminCheck('check_out')}
            className="flex-1 rounded-md border-2 border-orange-deep py-3 text-base font-bold text-orange-deep transition-transform active:scale-95 disabled:opacity-60"
          >
            Admin Check Out
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
