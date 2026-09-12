'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function RunLibraryBillingButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/library/run-billing', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Billing run failed.');
      setResult(`Invoiced ${data.billed} membership${data.billed === 1 ? '' : 's'}${data.skipped ? `, ${data.skipped} skipped (0 fee)` : ''}.`);
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Billing run failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="ghost" onClick={run} disabled={busy}>
        {busy ? 'Running…' : 'Run billing now'}
      </Button>
      {result && <p className="text-xs font-semibold text-ink-soft">{result}</p>}
    </div>
  );
}
