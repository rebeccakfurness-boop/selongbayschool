'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** One-click add for a suggested expense estimate (see getForecastExpenseSuggestions) — skips the
 * form entirely since the suggestion already has everything a forecast line needs. */
export default function AddSuggestedForecastButton({
  quarterLabel,
  quarterStartDate,
  quarterEndDate,
  categoryId,
  categoryName,
  suggestedAmountIdr,
}: {
  quarterLabel: string;
  quarterStartDate: string;
  quarterEndDate: string;
  categoryId: number;
  categoryName: string;
  suggestedAmountIdr: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function add() {
    setSaving(true);
    try {
      await fetch('/api/admin/budget/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarterLabel,
          quarterStartDate,
          quarterEndDate,
          entryType: 'expense',
          categoryId,
          label: categoryName,
          estimatedAmountIdr: suggestedAmountIdr,
          notes: "Suggested from the trailing 3 months' actual spend",
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" onClick={add} disabled={saving} className="text-xs font-bold text-teal-deep hover:underline disabled:opacity-50">
      {saving ? 'Adding…' : '+ Add to forecast'}
    </button>
  );
}
