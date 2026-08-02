'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/admin-format';

interface AttendanceHistoryRow {
  id: number;
  event_type: 'check_in' | 'check_out';
  session_type: 'daily' | 'activity';
  activity_name: string | null;
  occurred_at: string;
  source: 'kiosk' | 'parent_portal' | 'admin';
  performed_by_label: string | null;
  signed_by_name: string | null;
  has_signature: boolean;
}

function eventLabel(row: AttendanceHistoryRow): string {
  const action = row.event_type === 'check_in' ? 'Checked in' : 'Checked out';
  return row.session_type === 'activity' ? `${action} — ${row.activity_name ?? 'Activity'}` : action;
}

function sourceLabel(row: AttendanceHistoryRow): string {
  if (row.source === 'kiosk') return row.signed_by_name ? `Gate kiosk — signed by ${row.signed_by_name}` : 'Gate kiosk';
  if (row.source === 'parent_portal') return row.performed_by_label ? `Portal — ${row.performed_by_label}` : 'Parent portal';
  return row.performed_by_label ? `Admin override — ${row.performed_by_label}` : 'Admin override';
}

/** YYYY-MM-DDTHH:mm in the browser's own local time — the format <input type="datetime-local">
 * requires, and a sensible default for "check this child in/out right now" rather than making
 * staff re-enter the current time by hand every time. */
function nowForDatetimeLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Self-fetching (rather than server-prop-drilled like the rest of ChildCard's sections) so
 * adding it here didn't require threading attendance data through both ChildCard call sites
 * (FamilyBoard's board tiles and the /admin/families/[id] detail page). */
export default function AttendanceSection({ childId }: { childId: number }) {
  const [history, setHistory] = useState<AttendanceHistoryRow[] | null>(null);
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [eventType, setEventType] = useState<'check_in' | 'check_out'>('check_in');
  const [occurredAt, setOccurredAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/children/${childId}/attendance`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setHistory(data.history);
        setOpenDays(data.openDays ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  async function load() {
    const res = await fetch(`/api/admin/children/${childId}/attendance`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setHistory(data.history);
      setOpenDays(data.openDays ?? []);
    }
  }

  async function submitCorrection() {
    if (!occurredAt) {
      setError('Pick a date and time.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/children/${childId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, sessionType: 'daily', occurredAt: new Date(occurredAt).toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the correction.');
      setOccurredAt('');
      setShowCorrection(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the correction.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(eventId: number) {
    setHistory((prev) => (prev ? prev.filter((h) => h.id !== eventId) : prev));
    await fetch(`/api/admin/children/${childId}/attendance/${eventId}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Attendance</h3>
        <button
          type="button"
          onClick={() => {
            setShowCorrection((s) => !s);
            if (!showCorrection && !occurredAt) setOccurredAt(nowForDatetimeLocalInput());
          }}
          className="text-xs font-semibold text-teal-deep hover:underline"
        >
          {showCorrection ? 'Cancel' : '+ Check in/out (admin override)'}
        </button>
      </div>

      {openDays.length > 0 && (
        <p className="mt-2 rounded-sm bg-orange/10 px-3 py-2 text-xs font-semibold text-orange-deep">
          Checked in with no check-out on {openDays.length} day{openDays.length === 1 ? '' : 's'}: {openDays.join(', ')}
        </p>
      )}

      {showCorrection && (
        <div className="mt-3 border-b border-sand-line pb-4">
          <p className="mb-2 text-xs text-ink-soft">
            No signature required — this is recorded as an admin action on behalf of the parent (e.g. they called the
            office, or forgot to check out). Every kiosk/portal check-in normally requires the parent&apos;s signature;
            this is the deliberate override.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-ink-soft" htmlFor="att-correction-type">Type</label>
              <select
                id="att-correction-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as 'check_in' | 'check_out')}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm text-ink"
              >
                <option value="check_in">Check In</option>
                <option value="check_out">Check Out</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-ink-soft" htmlFor="att-correction-time">Date &amp; time</label>
              <input
                id="att-correction-time"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm text-ink"
              />
            </div>
            <button
              type="button"
              onClick={submitCorrection}
              disabled={saving}
              className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
          </div>
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {history?.slice(0, 20).map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-ink">{eventLabel(row)}</span>
            <span className="flex items-center gap-2 text-xs text-ink-soft">
              {formatDateTime(row.occurred_at)} · {sourceLabel(row)}
              {row.has_signature && (
                <a
                  href={`/api/admin/children/${childId}/attendance/${row.id}/signature`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-deep hover:underline"
                >
                  View signature
                </a>
              )}
              <button type="button" onClick={() => deleteEntry(row.id)} className="font-semibold text-orange-deep hover:underline">
                Delete
              </button>
            </span>
          </li>
        ))}
        {history?.length === 0 && <li className="text-sm text-ink-soft">No attendance recorded yet.</li>}
        {history === null && <li className="text-sm text-ink-soft">Loading…</li>}
      </ul>
    </div>
  );
}
