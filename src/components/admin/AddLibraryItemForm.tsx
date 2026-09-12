'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import LibraryItemPhotoUpload from '@/components/admin/LibraryItemPhotoUpload';
import LibraryCoverSearch from '@/components/admin/LibraryCoverSearch';

const selectClasses = 'rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink';

export default function AddLibraryItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [description, setDescription] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState('');
  const [tags, setTags] = useState('');
  const [schoolOnly, setSchoolOnly] = useState(false);
  const [saving, setSaving] = useState(false);
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

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/library/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          title,
          author,
          category,
          itemCode,
          description,
          totalCopies: Number(totalCopies),
          photoUrl,
          ageGroup,
          tags,
          schoolOnly,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add this item.');
      setOpen(false);
      setTitle('');
      setAuthor('');
      setCategory('');
      setItemCode('');
      setDescription('');
      setTotalCopies('1');
      setPhotoUrl(null);
      setAgeGroup('');
      setTags('');
      setSchoolOnly(false);
      setLookupQuery('');
      setLookupError(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this item.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        Add item
      </Button>
    );
  }

  return (
    <div className="w-full rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Add a catalogue item</h2>

      {itemType === 'book' && (
        <div className="mt-4 rounded-sm border border-sand-line bg-sand/30 p-4">
          <label htmlFor="li-lookup" className="font-sans text-sm font-bold text-ink">
            Look up by ISBN or title
          </label>
          <p className="mt-1 text-xs text-ink-soft">Fills in the title, author, description and cover below automatically — like Libib&apos;s lookup.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <TextInput
              id="li-lookup"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  lookupBook();
                }
              }}
              placeholder="e.g. 9780141439518 or Charlotte's Web"
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="li-type" required>
          <select id="li-type" value={itemType} onChange={(e) => setItemType(e.target.value)} className={selectClasses}>
            <option value="book">Book</option>
            <option value="toy">Toy</option>
            <option value="sports_equipment">Sports equipment</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Title" htmlFor="li-title" required>
          <TextInput id="li-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Author (books only)" htmlFor="li-author">
          <TextInput id="li-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Field>
        <Field label="Category" htmlFor="li-category">
          <TextInput id="li-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Picture books, Ball games" />
        </Field>
        <Field label="Item code / barcode (ISBN for books)" htmlFor="li-code">
          <TextInput id="li-code" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
        </Field>
        <Field label="Copies on the shelf" htmlFor="li-copies" required>
          <TextInput id="li-copies" type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} />
        </Field>
        <Field label="Age range" htmlFor="li-age">
          <TextInput id="li-age" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="e.g. 3-5 years" />
        </Field>
        <Field label="Tags" htmlFor="li-tags">
          <TextInput id="li-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. Fiction, Adventure, Picture book" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" htmlFor="li-description">
            <TextArea id="li-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Photo" htmlFor="li-photo">
            <LibraryItemPhotoUpload currentUrl={photoUrl} pathPrefix="library-items" onUploaded={setPhotoUrl} />
          </Field>
          {itemType === 'book' && (
            <div className="mt-2">
              <LibraryCoverSearch onSelect={setPhotoUrl} />
            </div>
          )}
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="li-school-only" type="checkbox" checked={schoolOnly} onChange={(e) => setSchoolOnly(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="li-school-only" className="text-sm font-semibold text-ink">
            School use only — recorded in the catalogue but never checked out or reserved to take home
          </label>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="primary" onClick={submit} disabled={saving || !title.trim()}>
          {saving ? 'Adding…' : 'Add item'}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-soft underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
