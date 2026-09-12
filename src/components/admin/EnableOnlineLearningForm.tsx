'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field } from '@/components/forms/FormField';

/** Turning online learning ON for a student is the one action here that isn't gated behind the
 * admin-only Child Card PATCH (see the toggle route's own comment) -- a teacher picks a student
 * from their own classes and this jumps straight to the programme/schedule manager, rather than
 * making them find the toggle buried in the full Child Card edit form first. */
export default function EnableOnlineLearningForm({
  candidates,
}: {
  candidates: { id: number; child_full_name: string; class_name: string | null }[];
}) {
  const router = useRouter();
  const [childId, setChildId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enable() {
    if (!childId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/online-learning/students/${childId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not turn on online learning for this student.');
      router.push(`/admin/online-learning/students/${childId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn on online learning for this student.');
      setSaving(false);
    }
  }

  if (candidates.length === 0) {
    return <p className="text-sm text-ink-soft">Every student in your classes already has online learning turned on.</p>;
  }

  return (
    <div className="rounded-md border border-dashed border-sand-line bg-paper/60 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Turn on for a student</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <Field label="Student" htmlFor="online-learning-candidate">
          <select
            id="online-learning-candidate"
            value={childId}
            onChange={(e) => setChildId(e.target.value ? Number(e.target.value) : '')}
            className="rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Choose a student…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.child_full_name}{c.class_name ? ` · ${c.class_name}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Button type="button" variant="primary" onClick={enable} disabled={!childId || saving}>
          {saving ? 'Turning on…' : 'Turn on online learning'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
