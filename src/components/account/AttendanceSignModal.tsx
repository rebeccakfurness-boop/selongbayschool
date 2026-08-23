'use client';

import { useRef, useState } from 'react';
import Button from '@/components/Button';
import SignaturePad, { type SignaturePadHandle } from '@/components/SignaturePad';

/** Confirms a check-in/check-out with a drawn signature before it's submitted — the parent-portal
 * counterpart to the kiosk's sign step (KioskDailyBoard/KioskActivityBoard). The signer's name
 * isn't collected here: the API route resolves it server-side from the logged-in account, so this
 * modal only needs the signature itself. */
export default function AttendanceSignModal({
  title,
  confirmLabel,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  confirmLabel: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (signatureDataUrl: string) => void;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [padError, setPadError] = useState<string | null>(null);

  function handleConfirm() {
    if (padRef.current?.isEmpty()) {
      setPadError('Draw your signature first.');
      return;
    }
    setPadError(null);
    onConfirm(padRef.current!.toDataUrl());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-xs text-ink-soft">Sign below to confirm. This is recorded with the check-in/out.</p>

        <div className="mt-3">
          <SignaturePad ref={padRef} />
        </div>

        {(padError || error) && <p className="mt-2 text-xs font-semibold text-orange-deep">{padError || error}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Saving…' : confirmLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => padRef.current?.clear()} disabled={submitting}>
            Clear
          </Button>
          <button type="button" onClick={onCancel} className="ml-auto text-sm font-semibold text-ink-soft hover:underline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
