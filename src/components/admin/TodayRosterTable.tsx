'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/admin-format';
import type { TodayRosterSummary } from '@/lib/attendance';

const STATUS_LABELS: Record<string, string> = {
  not_arrived: 'Not yet arrived',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
};

const STATUS_CLASSES: Record<string, string> = {
  not_arrived: 'bg-sand/40 text-ink-soft',
  checked_in: 'bg-teal/15 text-teal-deep',
  checked_out: 'bg-orange/15 text-orange-deep',
};

/** Client component only for the Undo button — everything else about today's roster is plain
 * server-rendered data from getTodayRosterSummary. Undo reuses the same delete route as the Child
 * Card's Attendance section (/api/admin/children/[id]/attendance/[eventId]). */
export default function TodayRosterTable({ roster }: { roster: TodayRosterSummary[] }) {
  const router = useRouter();
  const [undoingId, setUndoingId] = useState<number | null>(null);

  async function undo(childId: number, eventId: number) {
    setUndoingId(eventId);
    try {
      await fetch(`/api/admin/children/${childId}/attendance/${eventId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setUndoingId(null);
    }
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-sand-line text-left">
          <th className="py-2 font-bold text-ink-soft">Student</th>
          <th className="py-2 font-bold text-ink-soft">Class</th>
          <th className="py-2 font-bold text-ink-soft">Status</th>
          <th className="py-2 font-bold text-ink-soft">Time</th>
          <th className="py-2 font-bold text-ink-soft"></th>
        </tr>
      </thead>
      <tbody>
        {roster.map((r) => (
          <tr key={r.childId} className="border-b border-sand-line/60 last:border-0">
            <td className="py-2 font-semibold text-ink">{r.childFullName}</td>
            <td className="py-2 text-ink-soft">{r.className ?? '-'}</td>
            <td className="py-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
            </td>
            <td className="py-2 text-ink-soft">{r.lastEventTime ? formatDateTime(r.lastEventTime) : '-'}</td>
            <td className="py-2 text-right">
              {r.lastEventId && (
                <button
                  type="button"
                  disabled={undoingId === r.lastEventId}
                  onClick={() => undo(r.childId, r.lastEventId!)}
                  className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-60"
                >
                  {undoingId === r.lastEventId ? 'Undoing…' : 'Undo'}
                </button>
              )}
            </td>
          </tr>
        ))}
        {roster.length === 0 && (
          <tr>
            <td colSpan={5} className="py-6 text-center text-ink-soft">No regular students on file.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
