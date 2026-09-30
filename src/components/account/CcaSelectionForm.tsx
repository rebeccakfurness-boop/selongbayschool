'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatIDR } from '@/lib/site-content';
import type { CcaSelectionRow } from '@/lib/cca';

export interface CcaCatalogItem {
  id: number;
  name: string;
  description: string | null;
  dayOfWeek: string | null;
  /** Per-week rate as entered by admin -- resolvedPriceIdr (below) is this times weeksInTerm,
   * the actual amount charged. Shown alongside it so parents can see how the total was reached. */
  perWeekPriceIdr: number;
  resolvedPriceIdr: number;
  options: { id: number; name: string; perWeekPriceIdr: number; resolvedPriceIdr: number }[];
}

export default function CcaSelectionForm({
  childId,
  catalog,
  existingSelection,
  selectionOpen,
  weeksInTerm,
}: {
  childId: number;
  catalog: CcaCatalogItem[];
  existingSelection: CcaSelectionRow | null;
  selectionOpen: boolean;
  weeksInTerm: number;
}) {
  const router = useRouter();

  // Map of ccaId -> optionId ('' for no-option CCAs that are checked, or unset if not selected).
  const initialPicked = useMemo(() => {
    const picked = new Map<number, number | null>();
    for (const item of existingSelection?.items ?? []) {
      picked.set(item.cca_id, item.option_id);
    }
    return picked;
  }, [existingSelection]);

  const [picked, setPicked] = useState<Map<number, number | null>>(initialPicked);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<{ totalAmountIdr: number } | null>(null);

  function toggleNoOption(ccaId: number, checked: boolean) {
    setPicked((prev) => {
      const next = new Map(prev);
      if (checked) next.set(ccaId, null);
      else next.delete(ccaId);
      return next;
    });
  }

  function pickOption(ccaId: number, optionId: number) {
    setPicked((prev) => {
      const next = new Map(prev);
      next.set(ccaId, optionId);
      return next;
    });
  }

  function unpickCca(ccaId: number) {
    setPicked((prev) => {
      const next = new Map(prev);
      next.delete(ccaId);
      return next;
    });
  }

  const total = useMemo(() => {
    let sum = 0;
    for (const [ccaId, optionId] of picked) {
      const item = catalog.find((c) => c.id === ccaId);
      if (!item) continue;
      if (item.options.length === 0) {
        sum += item.resolvedPriceIdr;
      } else {
        const option = item.options.find((o) => o.id === optionId);
        if (option) sum += option.resolvedPriceIdr;
      }
    }
    return sum;
  }, [picked, catalog]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const items = Array.from(picked.entries()).map(([ccaId, optionId]) => ({ ccaId, optionId }));
      const res = await fetch('/api/account/cca/selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your selection');
      setJustSubmitted({ totalAmountIdr: data.totalAmountIdr });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your selection');
    } finally {
      setSubmitting(false);
    }
  }

  if (existingSelection?.status === 'invoiced') {
    return (
      <div className="rounded-md border border-teal/30 bg-teal/10 p-4 text-sm">
        <p className="font-semibold text-teal-deep">Selections confirmed and invoiced — {formatIDR(existingSelection.total_amount_idr)}.</p>
        <ul className="mt-2 flex flex-col gap-1 text-ink-soft">
          {existingSelection.items.map((item) => (
            <li key={item.id}>
              {item.cca_name}{item.option_name ? ` — ${item.option_name}` : ''} ({formatIDR(item.price_idr)})
            </li>
          ))}
        </ul>
        {existingSelection.invoice_id != null && (
          <a href={`/api/invoices/${existingSelection.invoice_id}/pdf`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-teal-deep underline">
            View invoice (bank transfer details inside)
          </a>
        )}
      </div>
    );
  }

  if (justSubmitted) {
    return (
      <div className="rounded-md border border-teal/30 bg-teal/10 p-4 text-sm">
        <p className="font-semibold text-teal-deep">Selection submitted — total {formatIDR(justSubmitted.totalAmountIdr)}.</p>
        <p className="mt-1 text-ink-soft">You can still change your selections until the school invoices you.</p>
      </div>
    );
  }

  if (catalog.length === 0) {
    return <p className="text-sm text-ink-soft">No CCAs are available to select yet.</p>;
  }

  function priceLabel(perWeekPriceIdr: number, resolvedPriceIdr: number): string {
    if (resolvedPriceIdr <= 0) return 'Free';
    return weeksInTerm > 1 ? `${formatIDR(resolvedPriceIdr)} (${formatIDR(perWeekPriceIdr)}/wk × ${weeksInTerm})` : formatIDR(resolvedPriceIdr);
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {catalog.map((item) => {
          const isPicked = picked.has(item.id);
          return (
            <li key={item.id} className="rounded-sm border border-sand-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">
                    {item.name}
                    {item.dayOfWeek && <span className="ml-2 text-xs font-normal text-ink-soft">{item.dayOfWeek}</span>}
                  </div>
                  {item.description && <p className="mt-1 text-sm text-ink-soft">{item.description}</p>}
                </div>
                {item.options.length === 0 && (
                  <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <input
                      type="checkbox"
                      checked={isPicked}
                      disabled={!selectionOpen}
                      onChange={(e) => toggleNoOption(item.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    {priceLabel(item.perWeekPriceIdr, item.resolvedPriceIdr)}
                  </label>
                )}
              </div>

              {item.options.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {item.options.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="radio"
                        name={`cca-${item.id}`}
                        checked={picked.get(item.id) === option.id}
                        disabled={!selectionOpen}
                        onChange={() => pickOption(item.id, option.id)}
                        className="h-4 w-4"
                      />
                      {option.name} — {priceLabel(option.perWeekPriceIdr, option.resolvedPriceIdr)}
                    </label>
                  ))}
                  {isPicked && (
                    <button type="button" onClick={() => unpickCca(item.id)} disabled={!selectionOpen} className="mt-1 self-start text-xs font-semibold text-ink-soft hover:underline">
                      Clear selection
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-sand/20 p-3 text-sm">
        <span>
          <span className="font-semibold text-ink">Total: </span>
          <span className="font-bold text-teal-deep">{formatIDR(total)}</span>
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !selectionOpen}
          className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Saving…' : 'Confirm selections'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
