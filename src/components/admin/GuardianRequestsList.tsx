'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface GuardianRequestRow {
  customer_id: number;
  child_id: number;
  child_full_name: string;
  guardian_name: string | null;
  guardian_email: string;
  relationship: string | null;
  requested_at: string;
}

export default function GuardianRequestsList({ initial }: { initial: GuardianRequestRow[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initial);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function review(row: GuardianRequestRow, decision: 'approved' | 'rejected') {
    const key = `${row.customer_id}-${row.child_id}`;
    setBusyKey(key);
    try {
      const res = await fetch(`/api/admin/guardian-requests/${row.customer_id}/${row.child_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => !(r.customer_id === row.customer_id && r.child_id === row.child_id)));
        router.refresh();
      }
    } finally {
      setBusyKey(null);
    }
  }

  if (requests.length === 0) {
    return <p className="text-sm text-ink-soft">No pending child link requests.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((row) => {
        const key = `${row.customer_id}-${row.child_id}`;
        return (
          <li key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-sand-line px-4 py-3 text-sm">
            <span>
              <span className="font-semibold text-ink">{row.guardian_name || row.guardian_email}</span>
              <span className="text-ink-soft"> wants to link </span>
              <span className="font-semibold text-ink">{row.child_full_name}</span>
              {row.relationship && <span className="text-ink-soft"> ({row.relationship})</span>}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                disabled={busyKey === key}
                onClick={() => review(row, 'approved')}
                className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyKey === key}
                onClick={() => review(row, 'rejected')}
                className="rounded-full border border-orange-deep px-4 py-1.5 text-xs font-bold text-orange-deep hover:bg-orange/10 disabled:opacity-60"
              >
                Reject
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
