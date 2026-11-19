'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import Image from 'next/image';
import { Field, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';
import { formatDateTime } from '@/lib/admin-format';
import { FEEDBACK_CATEGORY_LABELS, type ParentFeedbackRow } from '@/lib/parent-feedback';
import { FEEDBACK_CATEGORIES } from '@/lib/validation';

const UPLOAD_ENDPOINT = '/api/account/feedback/upload';

const selectClasses =
  'w-full rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

const STATUS_LABEL: Record<string, string> = { new: 'New', in_review: 'In review', resolved: 'Resolved' };
const STATUS_CLASS: Record<string, string> = {
  new: 'bg-orange/15 text-orange-deep',
  in_review: 'bg-lightteal/20 text-teal-deep',
  resolved: 'bg-teal/15 text-teal-deep',
};

export default function FeedbackForm({
  childOptions,
  initial,
}: {
  childOptions: { id: number; label: string }[];
  initial: ParentFeedbackRow[];
}) {
  const [history, setHistory] = useState(initial);
  const [childId, setChildId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { status, errorMessage, submit, reset } = useFormSubmit<{ id: number }>('/api/account/feedback');

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    setUploadError(null);
    try {
      const blob = await upload(`feedback-photos/${Date.now()}-${file.name}`, file, { access: 'public', handleUploadUrl: UPLOAD_ENDPOINT });
      setPhotoUrls((prev) => [...prev, blob.url]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload that photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    const result = await submit({
      childId: childId ? Number(childId) : null,
      category,
      description,
      desiredOutcome: desiredOutcome || null,
      urgent,
      photoUrls,
    });
    if (result) {
      setHistory((prev) => [
        {
          id: result.id,
          category,
          description,
          desired_outcome: desiredOutcome || null,
          urgent,
          status: 'new',
          child_full_name: childOptions.find((c) => String(c.id) === childId)?.label ?? null,
          created_at: new Date().toISOString(),
          photos: photoUrls.map((file_url, i) => ({ id: -1 - i, file_url })),
        },
        ...prev,
      ]);
      setChildId('');
      setCategory('');
      setDescription('');
      setDesiredOutcome('');
      setUrgent(false);
      setPhotoUrls([]);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Report a concern</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Use this for anything worrying you — from child safety and safeguarding to something smaller. It goes
          straight to the school office, not your child&apos;s teacher, so you can raise concerns about staff too.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="fb-category" required>
            <select id="fb-category" required value={category} onChange={(e) => setCategory(e.target.value)} className={selectClasses}>
              <option value="" disabled>
                Select a category
              </option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {FEEDBACK_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          {childOptions.length > 0 && (
            <Field label="Which child is this about? (optional)" htmlFor="fb-child">
              <select id="fb-child" value={childId} onChange={(e) => setChildId(e.target.value)} className={selectClasses}>
                <option value="">Not about a specific child</option>
                {childOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="mt-4">
          <Field label="What's concerning you?" htmlFor="fb-description" required>
            <TextArea
              id="fb-description"
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what happened, when, and who was involved if relevant."
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="What would you like to see happen? (optional)" htmlFor="fb-outcome">
            <TextArea
              id="fb-outcome"
              rows={3}
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="e.g. a call from the office, a policy check, a conversation with a staff member..."
            />
          </Field>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-4 w-4" />
          This needs urgent attention (e.g. an immediate safety concern)
        </label>

        <div className="mt-4">
          <span className="text-sm font-bold text-ink">Photos (optional)</span>
          {photoUrls.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photoUrls.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-md border border-sand-line">
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrls((prev) => prev.filter((u) => u !== url))}
                    className="absolute right-1 top-1 rounded-full bg-ink/70 px-1.5 text-xs font-bold text-white hover:bg-ink"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="mt-2 inline-block cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
            {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
          </label>
          {uploadError && <p className="mt-1 text-xs font-semibold text-orange-deep">{uploadError}</p>}
        </div>

        <div className="mt-5">
          <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="Thank you — this has been sent to the school office." />
        </div>
        <div className="mt-4">
          <Button type="submit" variant="primary" disabled={status === 'submitting' || uploadingPhoto}>
            {status === 'submitting' ? 'Sending…' : 'Send to the school office'}
          </Button>
          {status === 'error' && (
            <button type="button" onClick={reset} className="ml-3 text-sm font-semibold text-ink-soft hover:underline">
              Dismiss
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">What you&apos;ve reported</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Nothing reported yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {history.map((item) => (
              <li key={item.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">
                    {FEEDBACK_CATEGORY_LABELS[item.category] ?? item.category}
                    {item.child_full_name ? ` · ${item.child_full_name}` : ''}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
                {item.desired_outcome && (
                  <p className="mt-1 text-xs text-ink-soft">
                    <span className="font-semibold">Requested: </span>
                    {item.desired_outcome}
                  </p>
                )}
                {item.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.photos.map((p) => (
                      <a key={p.id} href={p.file_url} target="_blank" rel="noopener noreferrer" className="relative block h-14 w-14 overflow-hidden rounded-sm border border-sand-line">
                        <Image src={p.file_url} alt="" fill sizes="56px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-ink-soft">{formatDateTime(item.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
