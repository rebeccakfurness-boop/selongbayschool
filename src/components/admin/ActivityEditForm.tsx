'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { formatIDR } from '@/lib/site-content';
import PhotoUploadField from '@/components/admin/PhotoUploadField';

export interface ActivityDetail {
  id: number;
  name: string;
  day: string | null;
  duration: string | null;
  price_idr: number | null;
  price_note: string | null;
  default_time: string | null;
  default_capacity: number;
  is_active: boolean;
  photo_url: string | null;
  description: string;
  age_group: string | null;
}

export default function ActivityEditForm({ activity }: { activity: ActivityDetail }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);
  const [day, setDay] = useState(activity.day ?? '');
  const [defaultTime, setDefaultTime] = useState(activity.default_time ?? '');
  const [duration, setDuration] = useState(activity.duration ?? '');
  const [description, setDescription] = useState(activity.description);
  const [priceIDR, setPriceIDR] = useState(activity.price_idr != null ? String(activity.price_idr) : '');
  const [defaultCapacity, setDefaultCapacity] = useState(String(activity.default_capacity));
  const [photoUrl, setPhotoUrl] = useState(activity.photo_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    const ok = await patch({
      name,
      day,
      duration,
      description,
      priceIDR: priceIDR === '' ? null : Number(priceIDR),
      defaultTime,
      defaultCapacity: Number(defaultCapacity),
    });
    if (ok) setEditing(false);
  }

  async function uploadPhoto(url: string) {
    setPhotoUrl(url);
    await patch({ photoUrl: url });
  }

  if (!editing) {
    return (
      <div className="rounded-md border border-sand-line bg-paper p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-5">
            {photoUrl ? (
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-sand-line">
                <Image src={photoUrl} alt={activity.name} fill sizes="96px" className="object-cover" />
              </div>
            ) : (
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-sand-line text-[10px] text-ink-soft">
                No photo
              </div>
            )}
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{activity.name}</h2>
              <p className="mt-1 text-sm font-semibold text-teal-deep">
                {activity.day}
                {activity.default_time ? ` · ${activity.default_time}` : ''}
                {activity.duration ? ` · ${activity.duration}` : ''}
              </p>
              <p className="mt-2 max-w-prose text-sm text-ink-soft">{activity.description}</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {activity.price_idr ? formatIDR(activity.price_idr) : activity.price_note || 'No price set'}
                <span className="ml-3 font-normal text-ink-soft">Capacity {activity.default_capacity}</span>
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Photo" htmlFor="edit-photo">
          <PhotoUploadField currentUrl={photoUrl} pathPrefix={`activities/${activity.id}`} onUploaded={uploadPhoto} />
        </Field>
        <Field label="Name" htmlFor="edit-name" required>
          <TextInput id="edit-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Day" htmlFor="edit-day">
          <TextInput id="edit-day" value={day} onChange={(e) => setDay(e.target.value)} placeholder="e.g. Tuesdays" />
        </Field>
        <Field label="Default time" htmlFor="edit-time">
          <TextInput id="edit-time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} placeholder="e.g. 15:00" />
        </Field>
        <Field label="Duration" htmlFor="edit-duration">
          <TextInput id="edit-duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 1 hour" />
        </Field>
        <Field label="Price (IDR)" htmlFor="edit-price">
          <TextInput id="edit-price" type="number" min={0} step={1000} value={priceIDR} onChange={(e) => setPriceIDR(e.target.value)} />
        </Field>
        <Field label="Default capacity" htmlFor="edit-capacity" required>
          <TextInput id="edit-capacity" type="number" min={1} required value={defaultCapacity} onChange={(e) => setDefaultCapacity(e.target.value)} />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Description" htmlFor="edit-description" required>
            <TextArea id="edit-description" required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 font-semibold text-orange-deep">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
