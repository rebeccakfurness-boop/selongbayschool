'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { TextInput } from '@/components/forms/FormField';

export default function RedeemLibraryCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function redeem() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/account/library/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not apply that code.');
      setSuccess(true);
      setCode('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply that code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <TextInput
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          className="max-w-[220px]"
          onKeyDown={(e) => e.key === 'Enter' && redeem()}
        />
        <Button type="button" variant="ghost" onClick={redeem} disabled={loading || !code.trim()}>
          {loading ? 'Applying…' : 'Apply code'}
        </Button>
      </div>
      {error && <p className="text-sm font-semibold text-orange-deep">{error}</p>}
      {success && <p className="text-sm font-semibold text-teal-deep">Code applied — your membership has been updated.</p>}
    </div>
  );
}
