'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { formatDate } from '@/lib/admin-format';

export interface LessonPlan {
  id: number;
  class_name: string;
  week_label: string;
  subject: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

export default function LessonPlansManager({ initial, classOptions }: { initial: LessonPlan[]; classOptions: string[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initial);
  const [className, setClassName] = useState(classOptions[0] ?? '');
  const [weekLabel, setWeekLabel] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/lesson-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className, weekLabel, subject: subject || null, title, description: description || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create lesson plan');
      setPlans((prev) => [
        { id: data.id, class_name: className, week_label: weekLabel, subject: subject || null, title, description: description || null, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setWeekLabel('');
      setSubject('');
      setTitle('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson plan');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/lesson-plans/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">New lesson plan</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Class" htmlFor="lp-class" required>
            <TextInput id="lp-class" list="class-options" required value={className} onChange={(e) => setClassName(e.target.value)} />
            <datalist id="class-options">
              {classOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Week" htmlFor="lp-week" required>
            <TextInput id="lp-week" required value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} placeholder="e.g. Week 4, Term 1" />
          </Field>
          <Field label="Subject" htmlFor="lp-subject">
            <TextInput id="lp-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Title" htmlFor="lp-title" required>
            <TextInput id="lp-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description" htmlFor="lp-description">
            <TextArea id="lp-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
        <div className="mt-4">
          <Button type="button" variant="primary" onClick={create} disabled={saving || !className.trim() || !weekLabel.trim() || !title.trim()}>
            {saving ? 'Saving…' : 'Add lesson plan'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-base font-semibold text-ink">{p.title}</div>
                <div className="text-xs text-ink-soft">
                  {p.class_name} · {p.week_label}
                  {p.subject && ` · ${p.subject}`} · {formatDate(p.created_at)}
                </div>
                {p.description && <p className="mt-2 text-sm text-ink-soft">{p.description}</p>}
              </div>
              <button type="button" onClick={() => remove(p.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            No lesson plans yet.
          </div>
        )}
      </div>
    </div>
  );
}
