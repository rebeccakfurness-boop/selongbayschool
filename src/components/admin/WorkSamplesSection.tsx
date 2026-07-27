'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/admin/DocumentUploadField';
import { formatDate } from '@/lib/admin-format';

export interface WorkSample {
  id: number;
  title: string;
  file_url: string;
  created_at: string;
}

export default function WorkSamplesSection({ childId, initial, canEdit }: { childId: number; initial: WorkSample[]; canEdit: boolean }) {
  const router = useRouter();
  const [samples, setSamples] = useState(initial);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addSample(fileUrl: string) {
    if (!title.trim()) {
      setError('Give the work sample a title before uploading.');
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/admin/work-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, title, fileUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSamples((prev) => [{ id: data.id, title, file_url: fileUrl, created_at: new Date().toISOString() }, ...prev]);
      setTitle('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function remove(id: number) {
    setSamples((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/admin/work-samples/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h3 className="font-display text-base font-semibold text-ink">Work Samples</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {samples.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
            <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
              {s.title}
            </a>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span>{formatDate(s.created_at)}</span>
              {canEdit && (
                <button type="button" onClick={() => remove(s.id)} className="font-semibold text-orange-deep hover:underline">
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
        {samples.length === 0 && <li className="text-sm text-ink-soft">No work samples uploaded yet.</li>}
      </ul>

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand-line pt-4">
          <Field label="Title" htmlFor="work-sample-title">
            <TextInput id="work-sample-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 3 writing piece" />
          </Field>
          <DocumentUploadField currentUrl={null} pathPrefix={`children/${childId}/work-samples`} label="File" onUploaded={addSample} />
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
