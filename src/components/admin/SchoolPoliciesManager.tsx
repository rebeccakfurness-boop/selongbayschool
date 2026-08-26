'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import type { SchoolPolicyRow } from '@/lib/policies';

export default function SchoolPoliciesManager({ initial }: { initial: SchoolPolicyRow[] }) {
  const router = useRouter();
  const [policies, setPolicies] = useState(initial);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPolicy() {
    if (!title.trim()) {
      setError('Give the policy a title.');
      return;
    }
    if (!fileUrl.trim()) {
      setError('Paste a link to the document (e.g. a Google Drive share link).');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, fileUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save policy');
      setPolicies((prev) => [
        ...prev,
        { id: data.id, title, description: description || null, file_url: fileUrl, sort_order: 0, created_at: new Date().toISOString() },
      ]);
      setTitle('');
      setDescription('');
      setFileUrl('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/policies/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Add a school policy</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Paste the Google Drive share link for the document — it stays in Drive, this just lists it for
          parents and staff. Make sure the Drive link is shared as &quot;Anyone with the link can view&quot;
          before adding it here, or families won&apos;t be able to open it.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="pol-title" required>
            <TextInput id="pol-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Safeguarding Policy" />
          </Field>
          <Field label="Document link" htmlFor="pol-url" required>
            <TextInput
              id="pol-url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description (optional)" htmlFor="pol-description">
            <TextArea id="pol-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="button" variant="primary" onClick={addPolicy} disabled={saving}>
            {saving ? 'Saving…' : 'Add policy'}
          </Button>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {policies.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-2 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div>
              <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="font-display text-base font-semibold text-teal-deep hover:underline">
                {p.title}
              </a>
              {p.description && <p className="mt-2 text-sm text-ink-soft">{p.description}</p>}
            </div>
            <button type="button" onClick={() => remove(p.id)} className="shrink-0 text-xs font-semibold text-orange-deep hover:underline">
              Remove
            </button>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            No policies added yet.
          </div>
        )}
      </div>
    </div>
  );
}
