'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/DocumentUploadField';
import { CLASS_BAND_LABELS, CLASS_BAND_ORDER, type ClassBand } from '@/lib/family-data';

export interface Resource {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  class_band: ClassBand | null;
}

export default function ResourcesManager({ initial }: { initial: Resource[] }) {
  const router = useRouter();
  const [resources, setResources] = useState(initial);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classBand, setClassBand] = useState<ClassBand | ''>('');
  const [error, setError] = useState<string | null>(null);

  async function addResource(fileUrl: string) {
    if (!title.trim()) {
      setError('Give the resource a title before uploading.');
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, fileUrl, classBand: classBand || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save resource');
      setResources((prev) => [{ id: data.id, title, description: description || null, file_url: fileUrl, class_band: classBand || null }, ...prev]);
      setTitle('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource');
    }
  }

  async function remove(id: number) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Add a downloadable resource</h2>
        <p className="mt-1 text-xs text-ink-soft">Especially useful for hybrid/worldschooling parents on their off-campus days.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Title" htmlFor="res-title" required>
            <TextInput id="res-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Class band (leave blank for all)" htmlFor="res-band">
            <select
              id="res-band"
              value={classBand}
              onChange={(e) => setClassBand(e.target.value as ClassBand | '')}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              <option value="">All classes</option>
              {CLASS_BAND_ORDER.map((band) => (
                <option key={band} value={band}>{CLASS_BAND_LABELS[band]}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description" htmlFor="res-description">
            <TextArea id="res-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <DocumentUploadField currentUrl={null} pathPrefix="resources" label="File" onUploaded={addResource} />
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {resources.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-2 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div>
              <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="font-display text-base font-semibold text-teal-deep hover:underline">
                {r.title}
              </a>
              <div className="text-xs text-ink-soft">{r.class_band ? CLASS_BAND_LABELS[r.class_band] : 'All classes'}</div>
              {r.description && <p className="mt-2 text-sm text-ink-soft">{r.description}</p>}
            </div>
            <button type="button" onClick={() => remove(r.id)} className="text-xs font-semibold text-orange-deep hover:underline">
              Remove
            </button>
          </div>
        ))}
        {resources.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            No resources uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
