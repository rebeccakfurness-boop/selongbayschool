'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/DocumentUploadField';
import { formatDate } from '@/lib/admin-format';

export interface PhotoFeedItem {
  id: number;
  file_url: string;
  caption: string | null;
  created_at: string;
}

export default function ChildPhotoFeedSection({ childId, initial, canEdit }: { childId: number; initial: PhotoFeedItem[]; canEdit: boolean }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addPhoto(fileUrl: string) {
    setError(null);
    try {
      const res = await fetch('/api/admin/photo-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, caption: caption || null, childIds: [childId] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPhotos((prev) => [{ id: data.id, file_url: fileUrl, caption: caption || null, created_at: new Date().toISOString() }, ...prev]);
      setCaption('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function remove(id: number) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/photo-feed/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h3 className="font-display text-base font-semibold text-ink">Photo Feed</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id} className="relative">
            <div className="relative aspect-square overflow-hidden rounded-md border border-sand-line">
              <Image src={p.file_url} alt={p.caption || ''} fill sizes="150px" className="object-cover" />
            </div>
            {p.caption && <p className="mt-1 text-xs text-ink-soft">{p.caption}</p>}
            <p className="text-[10px] text-ink-soft/70">{formatDate(p.created_at)}</p>
            {canEdit && (
              <button type="button" onClick={() => remove(p.id)} className="mt-1 text-[10px] font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            )}
          </div>
        ))}
        {photos.length === 0 && <p className="col-span-full text-sm text-ink-soft">No photos yet.</p>}
      </div>

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand-line pt-4">
          <Field label="Caption (optional)" htmlFor="photo-caption">
            <TextInput id="photo-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Beach clean-up day" />
          </Field>
          <DocumentUploadField currentUrl={null} pathPrefix={`children/${childId}/photos`} label="Photo" onUploaded={addPhoto} />
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
