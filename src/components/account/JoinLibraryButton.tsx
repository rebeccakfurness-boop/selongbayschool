'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function JoinLibraryButton({ label = 'Join the library' }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/library/join', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not join the library.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the library.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="primary" onClick={join} disabled={loading}>
        {loading ? 'Joining…' : label}
      </Button>
      {error && <p className="text-sm font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
