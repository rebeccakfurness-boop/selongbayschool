'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import Image from 'next/image';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

const UPLOAD_ENDPOINT = '/api/admin/community/upload';

export interface CommunityPostItem {
  id: number;
  author_admin_user_id: number;
  author_name: string;
  author_role: 'admin' | 'teacher';
  author_position_title: string | null;
  title: string | null;
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  photos: { id: number; file_url: string }[];
}

function authorLabel(p: CommunityPostItem): string {
  return p.author_position_title || (p.author_role === 'admin' ? 'School Admin' : 'Teacher');
}

/** Compose form + list for the parent portal's Community feed -- any staff member can post and
 * remove their own post; an admin can remove anyone's. Photos are uploaded one at a time and
 * collected into a pending list before publishing; the optional attachment (most often a
 * newsletter PDF) is a single upload captured alongside its original filename, since
 * DocumentUploadField's onUploaded only hands back the Blob URL. */
export default function CommunityFeedManager({ initial, currentAdminUserId, isAdmin }: { initial: CommunityPostItem[]; currentAdminUserId: number; isAdmin: boolean }) {
  const [posts, setPosts] = useState(initial);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/community');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPosts(data.posts);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const blob = await upload(`community/photos/${file.name}`, file, { access: 'public', handleUploadUrl: UPLOAD_ENDPOINT });
      setPendingPhotos((prev) => [...prev, blob.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAttachment(true);
    setError(null);
    try {
      const blob = await upload(`community/attachments/${file.name}`, file, { access: 'public', handleUploadUrl: UPLOAD_ENDPOINT });
      setAttachment({ url: blob.url, name: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that file.');
    } finally {
      setUploadingAttachment(false);
    }
  }

  const canPost = bodyText.trim().length > 0 && !uploadingPhoto && !uploadingAttachment;

  async function publish() {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          body: bodyText.trim(),
          photoUrls: pendingPhotos,
          attachmentUrl: attachment?.url,
          attachmentName: attachment?.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not publish that post.');
      setTitle('');
      setBodyText('');
      setPendingPhotos([]);
      setAttachment(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish that post.');
    } finally {
      setPosting(false);
    }
  }

  async function remove(id: number) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/community/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Post an update</h2>
        <p className="mt-1 text-xs text-ink-soft">Shows up in every family&apos;s Community feed in the parent portal, newest first.</p>

        <div className="mt-4 flex flex-col gap-4">
          <Field label="Title (optional)" htmlFor="cp-title">
            <TextInput id="cp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Term 3 Newsletter" />
          </Field>
          <Field label="Update" htmlFor="cp-body" required>
            <TextArea id="cp-body" rows={4} value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="What's happening at the school?" />
          </Field>

          {pendingPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {pendingPhotos.map((url, i) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-md border border-sand-line">
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingPhotos((prev) => prev.filter((u) => u !== url))}
                    className="absolute right-1 top-1 rounded-full bg-ink/70 px-1.5 text-xs font-bold text-white hover:bg-ink"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
              {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
            </label>
            <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
              {uploadingAttachment ? 'Uploading…' : attachment ? `Attached: ${attachment.name} (replace)` : '+ Attach a document (e.g. newsletter PDF)'}
              <input type="file" accept="application/pdf" onChange={handleAttachmentChange} disabled={uploadingAttachment} className="hidden" />
            </label>
            {attachment && (
              <button type="button" onClick={() => setAttachment(null)} className="text-xs font-semibold text-orange-deep hover:underline">
                Remove attachment
              </button>
            )}
          </div>

          <div>
            <Button type="button" variant="primary" onClick={publish} disabled={!canPost || posting}>
              {posting ? 'Posting…' : 'Post to Community feed'}
            </Button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((p) => (
          <div key={p.id} className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{p.author_name} <span className="font-normal text-ink-soft">· {authorLabel(p)}</span></p>
                <p className="text-xs text-ink-soft">{formatDate(p.created_at.slice(0, 10))}</p>
              </div>
              {(isAdmin || p.author_admin_user_id === currentAdminUserId) && (
                <button type="button" onClick={() => remove(p.id)} className="shrink-0 text-xs font-semibold text-orange-deep hover:underline">
                  Remove
                </button>
              )}
            </div>
            {p.title && <p className="mt-3 font-display text-base font-semibold text-ink">{p.title}</p>}
            <p className="mt-1.5 whitespace-pre-line text-sm text-ink">{p.body}</p>
            {p.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {p.photos.map((photo) => (
                  <a key={photo.id} href={photo.file_url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-md border border-sand-line">
                    <Image src={photo.file_url} alt="" fill sizes="150px" className="object-cover" />
                  </a>
                ))}
              </div>
            )}
            {p.attachment_url && (
              <a href={p.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-deep underline">
                📎 {p.attachment_name || 'View attachment'}
              </a>
            )}
          </div>
        ))}
        {posts.length === 0 && <p className="text-sm text-ink-soft">No posts yet.</p>}
      </div>
    </div>
  );
}
