'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChildAvatar from '@/components/ChildAvatar';
import KioskSignStep from '@/components/kiosk/KioskSignStep';
import type { KioskRosterChildRow, AttendanceEventType } from '@/lib/attendance';

type ActionState = { child: KioskRosterChildRow } | null;
type SigningState = { child: KioskRosterChildRow; eventType: AttendanceEventType } | null;
type ConfirmState = { childId: number; eventId: number; childName: string; eventType: AttendanceEventType; time: string; byAdmin: boolean } | null;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour: 'numeric', minute: '2-digit' });
}

/** Gate kiosk daily roster — regular students only (see /kiosk/activities for activities-only
 * students). Since /kiosk now requires a staff login (src/proxy.ts), each student's action sheet
 * offers two paths: the parent signs it themselves (the usual tap-then-sign flow), or staff check
 * the child in/out directly with no signature — the admin override, always attributed to whoever's
 * signed into the kiosk. Either way lands on the same confirmation screen, which also offers an
 * immediate Undo for a mis-tap. */
export default function KioskDailyBoard({ roster, defaultCheckIn }: { roster: KioskRosterChildRow[]; defaultCheckIn: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<ActionState>(null);
  const [signing, setSigning] = useState<SigningState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState<number | null>(null);

  // Auto-returns to the list so the kiosk is ready for the next family without anyone having to
  // tap "Done" — but only once staff have had a real chance to notice a mistake and hit Undo.
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

  async function submitSigned(child: KioskRosterChildRow, eventType: AttendanceEventType, signedByName: string, signatureDataUrl: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, eventType, sessionType: 'daily', signedByName, signatureDataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setAction(null);
      setSigning(null);
      setConfirm({ childId: child.id, eventId: data.id, childName: child.child_nickname || child.child_full_name, eventType, time: formatTime(data.occurredAt), byAdmin: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAdminCheck(child: KioskRosterChildRow, eventType: AttendanceEventType) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, eventType, sessionType: 'daily' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setAction(null);
      setConfirm({ childId: child.id, eventId: data.id, childName: child.child_nickname || child.child_full_name, eventType, time: formatTime(data.occurredAt), byAdmin: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  async function undoEvent(childId: number, eventId: number) {
    setUndoing(eventId);
    try {
      await fetch(`/api/admin/children/${childId}/attendance/${eventId}`, { method: 'DELETE' });
    } finally {
      setUndoing(null);
      resetToList();
    }
  }

  async function logOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  if (confirm) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${confirm.eventType === 'check_in' ? 'bg-teal' : 'bg-orange'}`}>
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/90 text-6xl text-teal-deep">✓</div>
        <p className="mt-8 font-display text-4xl font-bold text-white">{confirm.childName}</p>
        <p className="mt-3 text-2xl font-semibold text-white">
          {confirm.eventType === 'check_in' ? 'Checked in' : 'Checked out'} at {confirm.time}
          {confirm.byAdmin && ' (admin)'}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={undoing === confirm.eventId}
            onClick={() => undoEvent(confirm.childId, confirm.eventId)}
            className="rounded-full border-2 border-white/70 px-6 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {undoing === confirm.eventId ? 'Undoing…' : 'Undo — made a mistake'}
          </button>
          <button type="button" onClick={resetToList} className="text-sm font-semibold text-white/80 underline">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (signing) {
    return (
      <KioskSignStep
        childName={signing.child.child_nickname || signing.child.child_full_name}
        actionLabel={signing.eventType === 'check_in' ? 'Check In' : 'Check Out'}
        submitting={submitting}
        error={error}
        onBack={() => {
          setSigning(null);
          setError(null);
        }}
        onConfirm={(signedByName, signatureDataUrl) => submitSigned(signing.child, signing.eventType, signedByName, signatureDataUrl)}
      />
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

        <p className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-soft">Parent signs</p>
        <div className="mt-2 flex w-full max-w-md flex-col gap-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setSigning({ child, eventType: 'check_in' })}
            className={`rounded-md py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60 ${
              defaultCheckIn ? 'bg-teal' : 'bg-teal/70'
            }`}
          >
            Check In
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => setSigning({ child, eventType: 'check_out' })}
            className={`rounded-md py-8 text-3xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60 ${
              !defaultCheckIn ? 'bg-orange-deep' : 'bg-orange-deep/70'
            }`}
          >
            Check Out
          </button>
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-soft">Or, staff check in without a signature</p>
        <div className="mt-2 flex w-full max-w-md gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitAdminCheck(child, 'check_in')}
            className="flex-1 rounded-md border-2 border-teal py-3 text-base font-bold text-teal-deep transition-transform active:scale-95 disabled:opacity-60"
          >
            Admin Check In
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitAdminCheck(child, 'check_out')}
            className="flex-1 rounded-md border-2 border-orange-deep py-3 text-base font-bold text-orange-deep transition-transform active:scale-95 disabled:opacity-60"
          >
            Admin Check Out
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
            <div
              key={child.id}
              className="flex items-center gap-4 rounded-md border border-sand-line bg-paper p-4 shadow-soft transition-transform hover:border-teal/50"
            >
              <button type="button" onClick={() => setAction({ child })} className="flex flex-1 items-center gap-4 text-left active:scale-95">
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
              {child.last_event_id && (
                <button
                  type="button"
                  disabled={undoing === child.last_event_id}
                  onClick={() => undoEvent(child.id, child.last_event_id!)}
                  className="whitespace-nowrap text-xs font-semibold text-orange-deep underline disabled:opacity-60"
                >
                  {undoing === child.last_event_id ? 'Undoing…' : 'Undo'}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-ink-soft">No students match &quot;{query}&quot;.</p>}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 flex gap-3">
        <a href="/kiosk/activities" className="rounded-full border border-sand-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft shadow-soft hover:border-teal/40">
          Activity check-in
        </a>
        <button type="button" onClick={logOut} className="rounded-full border border-sand-line bg-paper px-4 py-2 text-xs font-semibold text-ink-soft shadow-soft hover:border-teal/40">
          Log out
        </button>
      </div>
    </div>
  );
}
