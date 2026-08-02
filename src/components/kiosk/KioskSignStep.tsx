'use client';

import { useRef, useState } from 'react';
import SignaturePad, { type SignaturePadHandle } from '@/components/SignaturePad';

/** Full-screen sign step shared by the daily and activity kiosk boards — inserted between the
 * Check In/Check Out tap and the final confirmation screen. The kiosk has no login of any kind,
 * so unlike the parent portal (which already knows who's signing) this is the only place that
 * identity gets captured at all: a typed name plus a drawn signature. */
export default function KioskSignStep({
  childName,
  actionLabel,
  submitting,
  error,
  onBack,
  onConfirm,
}: {
  childName: string;
  actionLabel: string;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: (signedByName: string, signatureDataUrl: string) => void;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleConfirm() {
    if (!name.trim()) {
      setLocalError('Enter the name of the person signing.');
      return;
    }
    if (padRef.current?.isEmpty()) {
      setLocalError('Draw a signature.');
      return;
    }
    setLocalError(null);
    onConfirm(name.trim(), padRef.current!.toDataUrl());
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">
        Sign to {actionLabel.toLowerCase()} {childName}
      </h1>

      <div className="mt-6 w-full max-w-md">
        <label htmlFor="kiosk-sign-name" className="text-sm font-bold text-ink-soft">
          Your name
        </label>
        <input
          id="kiosk-sign-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          placeholder="Full name"
          className="mt-1 w-full rounded-md border border-sand-line bg-white px-4 py-3 text-lg text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />

        <p className="mt-4 text-sm font-bold text-ink-soft">Signature</p>
        <div className="mt-1">
          <SignaturePad ref={padRef} />
        </div>

        {(localError || error) && <p className="mt-2 text-sm font-semibold text-orange-deep">{localError || error}</p>}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="rounded-md bg-teal py-5 text-xl font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : `Confirm ${actionLabel}`}
          </button>
          <button
            type="button"
            onClick={() => padRef.current?.clear()}
            disabled={submitting}
            className="text-sm font-semibold text-ink-soft underline"
          >
            Clear signature
          </button>
          <button type="button" onClick={onBack} disabled={submitting} className="text-lg font-semibold text-ink-soft underline">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
