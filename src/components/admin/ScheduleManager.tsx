'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { DAY_LABELS, DAY_ORDER, type DayOfWeek, type ClassFormat } from '@/lib/class-schedule';

export interface ScheduleEntry {
  id: number;
  class_name: string;
  subject: string;
  teacher_id: number | null;
  teacher_label: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  format: ClassFormat;
  location_or_link: string | null;
}

export interface TeacherOption {
  id: number;
  label: string;
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function ScheduleManager({
  initial,
  classOptions,
  teacherOptions,
}: {
  initial: ScheduleEntry[];
  classOptions: string[];
  teacherOptions: TeacherOption[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [className, setClassName] = useState(classOptions[0] ?? '');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('09:30');
  const [format, setFormat] = useState<ClassFormat>('in_person');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/class-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          subject,
          teacherId: teacherId ? Number(teacherId) : null,
          dayOfWeek,
          startTime,
          endTime,
          format,
          locationOrLink: locationOrLink || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add schedule entry');
      const teacherLabel = teacherOptions.find((t) => t.id === Number(teacherId))?.label ?? null;
      setEntries((prev) => [
        ...prev,
        {
          id: data.id,
          class_name: className,
          subject,
          teacher_id: teacherId ? Number(teacherId) : null,
          teacher_label: teacherLabel,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          format,
          location_or_link: locationOrLink || null,
        },
      ]);
      setSubject('');
      setLocationOrLink('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add schedule entry');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/admin/class-schedule/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">New weekly slot</h2>
        <p className="mt-1 text-xs text-ink-soft">
          A recurring weekly class time — e.g. &quot;Maths, Monday 8:30–9:30, in person.&quot; This feeds the weekly
          schedule shown on the parent and student portals.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Class" htmlFor="cs-class" required>
            <TextInput id="cs-class" list="cs-class-options" required value={className} onChange={(e) => setClassName(e.target.value)} />
            <datalist id="cs-class-options">
              {classOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Subject" htmlFor="cs-subject" required>
            <TextInput id="cs-subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Maths" />
          </Field>
          <Field label="Teacher" htmlFor="cs-teacher">
            <select
              id="cs-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              <option value="">Not set</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Day" htmlFor="cs-day" required>
            <select
              id="cs-day"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </Field>
          <Field label="Start time" htmlFor="cs-start" required>
            <TextInput id="cs-start" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End time" htmlFor="cs-end" required>
            <TextInput id="cs-end" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
          <Field label="Format" htmlFor="cs-format" required>
            <select
              id="cs-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ClassFormat)}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              <option value="in_person">In person</option>
              <option value="online">Online</option>
            </select>
          </Field>
          <Field label={format === 'online' ? 'Video call link' : 'Room / location'} htmlFor="cs-location">
            <TextInput
              id="cs-location"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder={format === 'online' ? 'https://meet.google.com/...' : 'e.g. Room 4'}
            />
          </Field>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
        <div className="mt-4">
          <Button type="button" variant="primary" onClick={create} disabled={saving || !className.trim() || !subject.trim() || !startTime || !endTime}>
            {saving ? 'Saving…' : 'Add to schedule'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {DAY_ORDER.filter((day) => entries.some((e) => e.day_of_week === day)).map((day) => (
          <div key={day} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <h3 className="font-display text-sm font-bold text-ink">{DAY_LABELS[day]}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {entries
                .filter((e) => e.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
                    <div>
                      <span className="font-semibold text-ink">{e.subject}</span>
                      <span className="ml-2 text-ink-soft">{e.class_name}</span>
                      <span className="ml-2 text-xs text-ink-soft">
                        {formatTime(e.start_time)}–{formatTime(e.end_time)} · {e.teacher_label || 'No teacher set'} ·{' '}
                        {e.format === 'online' ? 'Online' : 'In person'}
                        {e.location_or_link && ` (${e.location_or_link})`}
                      </span>
                    </div>
                    <button type="button" onClick={() => remove(e.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            No weekly schedule set yet.
          </div>
        )}
      </div>
    </div>
  );
}
