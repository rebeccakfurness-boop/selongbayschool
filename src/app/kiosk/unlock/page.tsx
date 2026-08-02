'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function KioskUnlockPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not unlock the kiosk.');
      router.push('/kiosk');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock the kiosk.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
        <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
          <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
        </div>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">Gate Kiosk</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">Enter the kiosk PIN to unlock check-in on this device.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="rounded-md border border-sand-line bg-white px-4 py-4 text-center text-2xl tracking-[0.3em] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          {error && <p role="alert" className="text-center text-sm font-semibold text-orange-deep">{error}</p>}
          <Button type="submit" variant="primary" disabled={submitting || !pin} fullWidth>
            {submitting ? 'Unlocking…' : 'Unlock'}
          </Button>
        </form>
      </div>
      <p className="mt-6 text-xs text-ink-soft">This device stays unlocked once set up — only re-enter the PIN after locking it or resetting the browser.</p>
    </div>
  );
}
