'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/library/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, title, author, category, itemCode, description, totalCopies: Number(totalCopies) }),
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
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="li-type" required>
          <select id="li-type" value={itemType} onChange={(e) => setItemType(e.target.value)} className={selectClasses}>
            <option value="book">Book</option>
            <option value="toy">Toy</option>
            <option value="sports_equipment">Sports equipment</option>
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
        <Field label="Item code / barcode" htmlFor="li-code">
          <TextInput id="li-code" value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
        </Field>
        <Field label="Copies on the shelf" htmlFor="li-copies" required>
          <TextInput id="li-copies" type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" htmlFor="li-description">
            <TextArea id="li-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
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
