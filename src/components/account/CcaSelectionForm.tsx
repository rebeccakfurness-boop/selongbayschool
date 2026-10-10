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

const NONE_VALUE = '__none__';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="h-3 w-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** Every choice on this form -- whether it's one of several named options or the plain "join /
 * don't join" pair a no-option CCA gets synthesized into below -- renders through this one row, so
 * nothing on the page is a native checkbox next to native radios. A real radio input still backs
 * each row (keyboard/screen-reader behavior for free); only its default appearance is hidden. */
function ChoiceRow({
  id,
  groupName,
  checked,
  disabled,
  onSelect,
  label,
  priceLabel,
}: {
  id: string;
  groupName: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  label: string;
  priceLabel: string | null;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 rounded-md border-2 px-4 py-3 transition-colors ${
        checked ? 'border-teal bg-teal/5' : 'border-sand-line bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-teal/50'}`}
    >
      <input
        id={id}
        type="radio"
        name={groupName}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked ? 'border-teal bg-teal' : 'border-sand-line bg-white'
        }`}
      >
        {checked && <CheckIcon />}
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      {priceLabel && <span className="whitespace-nowrap text-sm font-semibold text-ink-soft">{priceLabel}</span>}
    </label>
  );
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

  // Map of ccaId -> optionId ('' for no-option CCAs that are picked, or unset if not picked).
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

  function pickNone(ccaId: number) {
    setPicked((prev) => {
      const next = new Map(prev);
      next.delete(ccaId);
      return next;
    });
  }

  function pickJoin(ccaId: number) {
    setPicked((prev) => {
      const next = new Map(prev);
      next.set(ccaId, null);
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
    const confirmed = window.confirm(
      "Submit this selection? Once submitted you won't be able to change it yourself -- if you need to make changes afterward, you'll need to contact the school office."
    );
    if (!confirmed) return;

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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your selection');
    } finally {
      setSubmitting(false);
    }
  }

  // Locked the instant something's been submitted -- status 'submitted' (editable only by an
  // admin unlocking it, see CcaSelectionReview's "Unlock for parent to edit") and 'invoiced' (never
  // editable again) both render this same read-only summary, just with different copy/actions.
  if (existingSelection) {
    const isInvoiced = existingSelection.status === 'invoiced';
    return (
      <div className="rounded-md border-2 border-teal/30 bg-teal/5 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal">
            <CheckIcon />
          </span>
          <p className="font-semibold text-teal-deep">{isInvoiced ? 'Confirmed and invoiced' : 'Selection submitted'}</p>
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {existingSelection.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-sm bg-white px-3 py-2 text-sm">
              <span className="text-ink">
                {item.cca_name}
                {item.option_name && <span className="text-ink-soft"> — {item.option_name}</span>}
              </span>
              <span className="whitespace-nowrap font-semibold text-ink-soft">{item.price_idr > 0 ? formatIDR(item.price_idr) : 'Free'}</span>
            </li>
          ))}
          {existingSelection.items.length === 0 && (
            <li className="rounded-sm bg-white px-3 py-2 text-sm text-ink-soft">No CCAs selected this term.</li>
          )}
        </ul>

        <div className="mt-3 flex items-center justify-between border-t border-teal/20 pt-3 text-sm">
          <span className="font-semibold text-ink">Total</span>
          <span className="font-bold text-teal-deep">{formatIDR(existingSelection.total_amount_idr)}</span>
        </div>

        {isInvoiced ? (
          existingSelection.invoice_id != null && (
            <a
              href={`/api/invoices/${existingSelection.invoice_id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-teal-deep underline"
            >
              View invoice (bank transfer details inside)
            </a>
          )
        ) : (
          <p className="mt-3 rounded-sm bg-white px-3 py-2 text-xs text-ink-soft">
            This selection is locked. To change it, please contact the school office — admin can reopen it for you to
            resubmit.
          </p>
        )}
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
      {!selectionOpen && (
        <p className="mb-3 rounded-sm border border-orange/30 bg-orange/10 px-3 py-2 text-xs font-semibold text-orange-deep">
          Selections are currently closed — the options below are shown for reference but can&apos;t be submitted right now.
        </p>
      )}
      <ul className={`flex flex-col gap-5 ${selectionOpen ? '' : 'pointer-events-none opacity-60'}`}>
        {catalog.map((item) => {
          const hasOptions = item.options.length > 0;
          const selectedOptionId = picked.get(item.id);
          const isNoneSelected = !picked.has(item.id);
          const groupName = `cca-${item.id}`;

          return (
            <li key={item.id}>
              <div className="mb-2">
                <div className="font-semibold text-ink">
                  {item.name}
                  {item.dayOfWeek && <span className="ml-2 text-xs font-normal text-ink-soft">{item.dayOfWeek}</span>}
                </div>
                {item.description && <p className="mt-0.5 text-sm text-ink-soft">{item.description}</p>}
              </div>

              <div className="flex flex-col gap-2">
                {hasOptions ? (
                  <>
                    {item.options.map((option) => (
                      <ChoiceRow
                        key={option.id}
                        id={`${groupName}-${option.id}`}
                        groupName={groupName}
                        checked={selectedOptionId === option.id}
                        disabled={!selectionOpen}
                        onSelect={() => pickOption(item.id, option.id)}
                        label={option.name}
                        priceLabel={priceLabel(option.perWeekPriceIdr, option.resolvedPriceIdr)}
                      />
                    ))}
                    <ChoiceRow
                      id={`${groupName}-${NONE_VALUE}`}
                      groupName={groupName}
                      checked={isNoneSelected}
                      disabled={!selectionOpen}
                      onSelect={() => pickNone(item.id)}
                      label="Not this term"
                      priceLabel={null}
                    />
                  </>
                ) : (
                  <>
                    <ChoiceRow
                      id={`${groupName}-yes`}
                      groupName={groupName}
                      checked={!isNoneSelected}
                      disabled={!selectionOpen}
                      onSelect={() => pickJoin(item.id)}
                      label="Yes, sign up"
                      priceLabel={priceLabel(item.perWeekPriceIdr, item.resolvedPriceIdr)}
                    />
                    <ChoiceRow
                      id={`${groupName}-no`}
                      groupName={groupName}
                      checked={isNoneSelected}
                      disabled={!selectionOpen}
                      onSelect={() => pickNone(item.id)}
                      label="Not this term"
                      priceLabel={null}
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-sand/20 p-3 text-sm">
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
