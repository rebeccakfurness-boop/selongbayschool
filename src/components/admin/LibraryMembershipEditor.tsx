'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LibraryMembershipEditor({
  membershipId,
  monthlyFeeIdr,
  discountPercent,
  status,
}: {
  membershipId: number;
  monthlyFeeIdr: number;
  discountPercent: number;
  status: 'active' | 'cancelled';
}) {
  const router = useRouter();
  const [fee, setFee] = useState(String(monthlyFeeIdr));
  const [discount, setDiscount] = useState(String(discountPercent));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(extra?: { status?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/library/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyFeeIdr: Number(fee), discountPercent: Number(discount), ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update this membership.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this membership.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="w-28 rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
        />
        <span className="text-xs text-ink-soft">−</span>
        <input
          type="number"
          min={0}
          max={100}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          className="w-16 rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
        />
        <span className="text-xs text-ink-soft">%</span>
        <button type="button" onClick={() => save()} disabled={busy} className="text-xs font-bold text-teal-deep hover:underline disabled:opacity-50">
          Save
        </button>
      </div>
      <button
        type="button"
        onClick={() => save({ status: status === 'active' ? 'cancelled' : 'active' })}
        disabled={busy}
        className="text-left text-xs font-semibold text-ink-soft hover:underline disabled:opacity-50"
      >
        {status === 'active' ? 'Deactivate membership' : 'Reactivate membership'}
      </button>
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
