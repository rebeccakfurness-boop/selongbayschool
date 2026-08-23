'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { DAY_LABELS, DAY_ORDER, type DayOfWeek, type ClassFormat } from '@/lib/class-schedule';
import { colorForSubject } from '@/lib/schedule-colors';
import type { StaffRole } from '@/lib/auth';

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
  meet_link: string | null;
  lesson_plan_id: number | null;
  lesson_plan_title: string | null;
  next_occurrence_meet_link: string | null;
  next_occurrence_sync_status: 'pending' | 'synced' | 'failed' | null;
  next_occurrence_sync_error: string | null;
}

export interface TeacherOption {
  id: number;
  label: string;
}

export interface LessonPlanOption {
  id: number;
  class_name: string;
  title: string;
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function ScheduleManager({
  initial,
  classOptions,
  teacherOptions,
  lessonPlanOptions,
  role,
  currentAdminUserId,
}: {
  initial: ScheduleEntry[];
  classOptions: string[];
  teacherOptions: TeacherOption[];
  lessonPlanOptions: LessonPlanOption[];
  role: StaffRole;
  currentAdminUserId: number;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const isAdmin = role === 'admin';
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
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

  const gridClassOptions = classOptions.length > 0 ? classOptions : [...new Set(entries.map((e) => e.class_name))];
  const [selectedClass, setSelectedClass] = useState(gridClassOptions[0] ?? '');
  const classEntries = useMemo(() => entries.filter((e) => e.class_name === selectedClass), [entries, selectedClass]);
  const daysPresent = DAY_ORDER.filter((day) => classEntries.some((e) => e.day_of_week === day));
  const rows = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of classEntries) {
      const key = e.start_time;
      if (!seen.has(key)) seen.set(key, `${formatTime(e.start_time)}–${formatTime(e.end_time)}`);
    }
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [classEntries]);

  function cellFor(day: DayOfWeek, startTimeKey: string): ScheduleEntry | undefined {
    return classEntries.find((e) => e.day_of_week === day && e.start_time === startTimeKey);
  }

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
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          format,
          location_or_link: locationOrLink || null,
          meet_link: null,
          lesson_plan_id: null,
          lesson_plan_title: null,
          next_occurrence_meet_link: null,
          next_occurrence_sync_status: null,
          next_occurrence_sync_error: null,
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
    setSelectedEntry(null);
    await fetch(`/api/admin/class-schedule/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  /** Teachers use this for their own sessions' Meet link and lesson plan (the only fields the API
   * lets them touch); admins can use it for the same two fields inline, without opening the full
   * reschedule form. */
  async function updateContent(id: number, patch: { meetLink?: string | null; lessonPlanId?: number | null }) {
    const res = await fetch(`/api/admin/class-schedule/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to save');
      return;
    }
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const lessonPlanTitle =
          patch.lessonPlanId !== undefined
            ? lessonPlanOptions.find((lp) => lp.id === patch.lessonPlanId)?.title ?? null
            : e.lesson_plan_title;
        return {
          ...e,
          meet_link: patch.meetLink !== undefined ? patch.meetLink : e.meet_link,
          lesson_plan_id: patch.lessonPlanId !== undefined ? patch.lessonPlanId : e.lesson_plan_id,
          lesson_plan_title: lessonPlanTitle,
        };
      })
    );
    router.refresh();
  }

  /** Admin-only full reschedule (time/day/room/teacher/format) — a proper in-place edit rather
   * than delete-and-recreate, so the row keeps its id (and with it, any lesson plan link, Meet
   * link, and generated occurrences don't get orphaned by a cascade delete). */
  async function reschedule(
    id: number,
    patch: {
      subject: string;
      teacherId: number | null;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      format: ClassFormat;
      locationOrLink: string | null;
    }
  ): Promise<boolean> {
    const res = await fetch(`/api/admin/class-schedule/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to save');
      return false;
    }
    const teacherLabel = teacherOptions.find((t) => t.id === patch.teacherId)?.label ?? null;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              subject: patch.subject,
              teacher_id: patch.teacherId,
              teacher_label: teacherLabel,
              day_of_week: patch.dayOfWeek,
              start_time: `${patch.startTime}:00`,
              end_time: `${patch.endTime}:00`,
              format: patch.format,
              location_or_link: patch.locationOrLink,
            }
          : e
      )
    );
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-6">
      {!isAdmin && (
        <p className="rounded-md border border-sand-line bg-sand/20 px-4 py-3 text-sm text-ink-soft">
          Click a session below to add a lesson plan or Meet link to your own classes. Only admins can change a
          session&apos;s time, room, or teacher.
        </p>
      )}
      {isAdmin && (
        <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">New weekly slot</h2>
          <p className="mt-1 text-xs text-ink-soft">
            A recurring weekly class time, e.g. &quot;Maths, Monday 8:30–9:30, in person.&quot; This feeds the
            weekly schedule shown on the parent and student portals.
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
      )}

      {gridClassOptions.length === 0 ? (
        <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
          No weekly schedule set yet.
        </div>
      ) : (
        <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-teal-deep">Weekly Timetable</h2>
            {gridClassOptions.length > 1 && (
              <label className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-ink-soft">Class</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm"
                >
                  {gridClassOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {classEntries.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No weekly schedule set for {selectedClass} yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-md border border-sand-line">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-sand/40">
                    <th className="border border-sand-line px-3 py-2 text-left font-bold text-ink-soft">Time</th>
                    {daysPresent.map((day) => (
                      <th key={day} className="border border-sand-line px-3 py-2 text-center font-bold text-ink-soft">
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([rowKey, rowLabel]) => (
                    <tr key={rowKey}>
                      <td className="whitespace-nowrap border border-sand-line bg-sand/20 px-3 py-2 font-semibold text-ink-soft">
                        {rowLabel}
                      </td>
                      {daysPresent.map((day) => {
                        const cell = cellFor(day, rowKey);
                        return (
                          <td key={day} className="border border-sand-line p-0 align-top">
                            {cell ? (
                              <button
                                type="button"
                                onClick={() => setSelectedEntry(cell)}
                                style={{ backgroundColor: colorForSubject(cell.subject) }}
                                className="flex h-full w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:brightness-95"
                              >
                                <span className="flex items-center gap-1.5 font-semibold text-ink">
                                  {cell.subject}
                                  {cell.next_occurrence_sync_status === 'failed' && (
                                    <span
                                      title="Google Calendar sync failed for the next session: open for details"
                                      className="inline-block h-2 w-2 shrink-0 rounded-full bg-orange-deep"
                                    />
                                  )}
                                </span>
                                <span className="text-xs text-ink/70">{cell.teacher_label || 'No teacher set'}</span>
                              </button>
                            ) : (
                              <div className="px-3 py-2 text-center text-xs text-ink-soft">&nbsp;</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedEntry && (
        <SessionCellModal
          entry={selectedEntry}
          isAdmin={isAdmin}
          canEditContent={isAdmin || selectedEntry.teacher_id === currentAdminUserId}
          teacherOptions={teacherOptions}
          lessonPlanOptions={lessonPlanOptions.filter((lp) => lp.class_name === selectedEntry.class_name)}
          onClose={() => setSelectedEntry(null)}
          onRemove={() => remove(selectedEntry.id)}
          onReschedule={async (patch) => {
            const ok = await reschedule(selectedEntry.id, patch);
            if (ok) setSelectedEntry(null);
          }}
          onUpdateContent={(patch) => {
            updateContent(selectedEntry.id, patch);
            setSelectedEntry((prev) =>
              prev
                ? {
                    ...prev,
                    meet_link: patch.meetLink !== undefined ? patch.meetLink : prev.meet_link,
                    lesson_plan_id: patch.lessonPlanId !== undefined ? patch.lessonPlanId : prev.lesson_plan_id,
                    lesson_plan_title:
                      patch.lessonPlanId !== undefined
                        ? lessonPlanOptions.find((lp) => lp.id === patch.lessonPlanId)?.title ?? null
                        : prev.lesson_plan_title,
                  }
                : prev
            );
          }}
        />
      )}
    </div>
  );
}

function SessionCellModal({
  entry,
  isAdmin,
  canEditContent,
  teacherOptions,
  lessonPlanOptions,
  onClose,
  onRemove,
  onReschedule,
  onUpdateContent,
}: {
  entry: ScheduleEntry;
  isAdmin: boolean;
  canEditContent: boolean;
  teacherOptions: TeacherOption[];
  lessonPlanOptions: LessonPlanOption[];
  onClose: () => void;
  onRemove: () => void;
  onReschedule: (patch: {
    subject: string;
    teacherId: number | null;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    format: ClassFormat;
    locationOrLink: string | null;
  }) => Promise<void>;
  onUpdateContent: (patch: { meetLink?: string | null; lessonPlanId?: number | null }) => void;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{entry.subject}</h3>
            <p className="text-sm text-ink-soft">{entry.class_name} · {DAY_LABELS[entry.day_of_week]}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        {isAdmin ? (
          <EditEntryForm entry={entry} teacherOptions={teacherOptions} onSave={onReschedule} />
        ) : (
          <div className="mt-3 rounded-sm bg-sand/20 p-3 text-sm">
            <span className="font-semibold text-ink">{formatTime(entry.start_time)}–{formatTime(entry.end_time)}</span>
            <span className="text-ink-soft"> · {entry.teacher_label || 'No teacher set'} · {entry.format === 'online' ? 'Online' : 'In person'}</span>
            {entry.location_or_link && <span className="text-ink-soft"> ({entry.location_or_link})</span>}
          </div>
        )}

        <div className="mt-4 border-t border-sand-line/60 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Google Calendar sync</p>
          {entry.next_occurrence_sync_status === null && (
            <p className="mt-1 text-sm text-ink-soft">No upcoming dated session to sync yet.</p>
          )}
          {entry.next_occurrence_sync_status === 'pending' && (
            <p className="mt-1 text-sm text-ink-soft">Next session hasn&apos;t synced to Google Calendar yet. This happens automatically, usually within a day.</p>
          )}
          {entry.next_occurrence_sync_status === 'synced' && (
            <p className="mt-1 text-sm text-teal-deep">
              Synced to Google Calendar{entry.next_occurrence_meet_link ? '. Meet link ready.' : '.'}
            </p>
          )}
          {entry.next_occurrence_sync_status === 'failed' && (
            <p className="mt-1 text-sm text-orange-deep">
              Sync failed for the next session{entry.next_occurrence_sync_error ? `: ${entry.next_occurrence_sync_error}` : '.'} It will retry automatically.
            </p>
          )}
        </div>

        {canEditContent && (
          <div className="mt-4 flex flex-col gap-3 border-t border-sand-line/60 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Lesson plan &amp; Meet link</p>
            <Field label="Lesson plan" htmlFor={`modal-lesson-plan-${entry.id}`}>
              <select
                id={`modal-lesson-plan-${entry.id}`}
                value={entry.lesson_plan_id ?? ''}
                onChange={(ev) => onUpdateContent({ lessonPlanId: ev.target.value ? Number(ev.target.value) : null })}
                className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
              >
                <option value="">None linked</option>
                {lessonPlanOptions.map((lp) => (
                  <option key={lp.id} value={lp.id}>{lp.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Meet link" htmlFor={`modal-meet-link-${entry.id}`}>
              <input
                id={`modal-meet-link-${entry.id}`}
                type="text"
                defaultValue={entry.meet_link ?? ''}
                onBlur={(ev) => {
                  const value = ev.target.value.trim();
                  if (value !== (entry.meet_link ?? '')) onUpdateContent({ meetLink: value || null });
                }}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-sm border border-sand-line px-3 py-2 text-sm"
              />
            </Field>
          </div>
        )}
        {!isAdmin && !canEditContent && entry.lesson_plan_title && (
          <p className="mt-3 text-sm text-ink-soft">Lesson plan: {entry.lesson_plan_title}</p>
        )}

        {isAdmin && (
          <div className="mt-4 border-t border-sand-line/60 pt-4">
            {confirmingRemove ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-orange-deep">Remove this session from the schedule?</span>
                <Button type="button" variant="primary" onClick={onRemove}>Yes, remove</Button>
                <button type="button" onClick={() => setConfirmingRemove(false)} className="text-sm font-semibold text-ink-soft hover:underline">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmingRemove(true)} className="text-sm font-semibold text-orange-deep hover:underline">
                Remove this session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditEntryForm({
  entry,
  teacherOptions,
  onSave,
}: {
  entry: ScheduleEntry;
  teacherOptions: TeacherOption[];
  onSave: (patch: {
    subject: string;
    teacherId: number | null;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    format: ClassFormat;
    locationOrLink: string | null;
  }) => Promise<void>;
}) {
  const [subject, setSubject] = useState(entry.subject);
  const [teacherId, setTeacherId] = useState(entry.teacher_id ? String(entry.teacher_id) : '');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(entry.day_of_week);
  const [startTime, setStartTime] = useState(formatTime(entry.start_time));
  const [endTime, setEndTime] = useState(formatTime(entry.end_time));
  const [format, setFormat] = useState<ClassFormat>(entry.format);
  const [locationOrLink, setLocationOrLink] = useState(entry.location_or_link ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        subject,
        teacherId: teacherId ? Number(teacherId) : null,
        dayOfWeek,
        startTime,
        endTime,
        format,
        locationOrLink: locationOrLink || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-sand-line/60 pt-4 sm:grid-cols-2">
      <Field label="Subject" htmlFor={`edit-subject-${entry.id}`} required>
        <TextInput id={`edit-subject-${entry.id}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Teacher" htmlFor={`edit-teacher-${entry.id}`}>
        <select
          id={`edit-teacher-${entry.id}`}
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
      <Field label="Day" htmlFor={`edit-day-${entry.id}`} required>
        <select
          id={`edit-day-${entry.id}`}
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
          className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
        >
          {DAY_ORDER.map((d) => (
            <option key={d} value={d}>{DAY_LABELS[d]}</option>
          ))}
        </select>
      </Field>
      <Field label="Format" htmlFor={`edit-format-${entry.id}`} required>
        <select
          id={`edit-format-${entry.id}`}
          value={format}
          onChange={(e) => setFormat(e.target.value as ClassFormat)}
          className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
        >
          <option value="in_person">In person</option>
          <option value="online">Online</option>
        </select>
      </Field>
      <Field label="Start time" htmlFor={`edit-start-${entry.id}`} required>
        <TextInput id={`edit-start-${entry.id}`} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </Field>
      <Field label="End time" htmlFor={`edit-end-${entry.id}`} required>
        <TextInput id={`edit-end-${entry.id}`} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </Field>
      <Field label={format === 'online' ? 'Video call link' : 'Room / location'} htmlFor={`edit-location-${entry.id}`}>
        <TextInput
          id={`edit-location-${entry.id}`}
          value={locationOrLink}
          onChange={(e) => setLocationOrLink(e.target.value)}
          placeholder={format === 'online' ? 'https://meet.google.com/...' : 'e.g. Room 4'}
        />
      </Field>
      <div className="flex items-end sm:col-span-2">
        <Button type="button" variant="primary" onClick={save} disabled={saving || !subject.trim() || !startTime || !endTime}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
