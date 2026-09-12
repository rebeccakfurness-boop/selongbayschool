'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import LibraryItemPhotoUpload from '@/components/admin/LibraryItemPhotoUpload';
import LibraryCoverSearch from '@/components/admin/LibraryCoverSearch';

export interface EditableLibraryItem {
  id: number;
  item_type: 'book' | 'toy' | 'sports_equipment' | 'other';
  title: string;
  author: string | null;
  category: string | null;
  item_code: string | null;
  description: string | null;
  photo_url: string | null;
  age_group: string | null;
  tags: string[];
  school_only: boolean;
  total_copies: number;
  is_active: boolean;
}

const selectClasses = 'rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink';

export default function EditLibraryItemForm({ item }: { item: EditableLibraryItem }) {
  const router = useRouter();
  const [itemType, setItemType] = useState(item.item_type);
  const [title, setTitle] = useState(item.title);
  const [author, setAuthor] = useState(item.author ?? '');
  const [category, setCategory] = useState(item.category ?? '');
  const [itemCode, setItemCode] = useState(item.item_code ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [totalCopies, setTotalCopies] = useState(String(item.total_copies));
  const [isActive, setIsActive] = useState(item.is_active);
  const [photoUrl, setPhotoUrl] = useState<string | null>(item.photo_url);
  const [ageGroup, setAgeGroup] = useState(item.age_group ?? '');
  const [tags, setTags] = useState(item.tags.join(', '));
  const [schoolOnly, setSchoolOnly] = useState(item.school_only);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lookupQuery, setLookupQuery] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  async function lookupBook() {
    if (!lookupQuery.trim()) return;
    setLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/admin/library/lookup-book?q=${encodeURIComponent(lookupQuery.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not find that book.');
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.photoUrl) setPhotoUrl(data.photoUrl);
      if (data.isbn) setItemCode(data.isbn);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Could not find that book.');
    } finally {
      setLookingUp(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/library/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          title,
          author,
          category,
          itemCode,
          description,
          photoUrl,
          ageGroup,
          tags,
          schoolOnly,
          totalCopies: Number(totalCopies),
          isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save this item.');
      router.push('/admin/library');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this item.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove "${item.title}" from the catalogue?`)) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/library/items/${item.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not remove this item.');
      router.push('/admin/library');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this item.');
      setRemoving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      {itemType === 'book' && (
        <div className="mb-4 rounded-sm border border-sand-line bg-sand/30 p-4">
          <label htmlFor="eli-lookup" className="font-sans text-sm font-bold text-ink">
            Refresh from ISBN or title
          </label>
          <p className="mt-1 text-xs text-ink-soft">Re-fetches the title, author, description and cover below — handy if any of it was entered by hand.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <TextInput
              id="eli-lookup"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  lookupBook();
                }
              }}
              placeholder={item.item_code || 'ISBN or title'}
              className="max-w-xs"
            />
            <button
              type="button"
              onClick={lookupBook}
              disabled={lookingUp || !lookupQuery.trim()}
              className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              {lookingUp ? 'Looking up…' : 'Look up'}
            </button>
          </div>
          {lookupError && <p className="mt-2 text-xs font-semibold text-orange-deep">{lookupError}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="eli-type" required>
          <select id="eli-type" value={itemType} onChange={(e) => setItemType(e.target.value as EditableLibraryItem['item_type'])} className={selectClasses}>
            <option value="book">Book</option>
            <option value="toy">Toy</option>
            <option value="sports_equipment">Sports equipment</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Title" htmlFor="eli-title" required>
          <TextInput id="eli-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Author (books only)" htmlFor="eli-author">
          <TextInput id="eli-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Field>
        <Field label="Category" htmlFor="eli-category">
          <TextInput id="eli-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Picture books, Ball games" />
        </Field>
        <Field label="Item code / barcode (ISBN for books)" htmlFor="eli-code">
          <TextInput id="eli-code" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
        </Field>
        <Field label="Copies on the shelf" htmlFor="eli-copies" required>
          <TextInput id="eli-copies" type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} />
        </Field>
        <Field label="Age range" htmlFor="eli-age">
          <TextInput id="eli-age" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="e.g. 3-5 years" />
        </Field>
        <Field label="Tags" htmlFor="eli-tags">
          <TextInput id="eli-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. Fiction, Adventure, Picture book" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" htmlFor="eli-description">
            <TextArea id="eli-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Photo" htmlFor="eli-photo">
            <LibraryItemPhotoUpload currentUrl={photoUrl} pathPrefix={`library-items/${item.id}`} onUploaded={setPhotoUrl} />
          </Field>
          {itemType === 'book' && (
            <div className="mt-2">
              <LibraryCoverSearch onSelect={setPhotoUrl} />
            </div>
          )}
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="eli-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="eli-active" className="text-sm font-semibold text-ink">
            Active (visible in the catalogue and available to check out or reserve)
          </label>
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="eli-school-only" type="checkbox" checked={schoolOnly} onChange={(e) => setSchoolOnly(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="eli-school-only" className="text-sm font-semibold text-ink">
            School use only — recorded in the catalogue but never checked out or reserved to take home
          </label>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Button type="button" variant="primary" onClick={save} disabled={saving || removing || !title.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <button type="button" onClick={() => router.push('/admin/library')} className="text-sm font-semibold text-ink-soft underline">
            Cancel
          </button>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={saving || removing}
          className="text-sm font-semibold text-orange-deep hover:underline disabled:opacity-50"
        >
          {removing ? 'Removing…' : 'Remove from catalogue'}
        </button>
      </div>
    </div>
  );
}
