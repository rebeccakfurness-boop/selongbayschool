'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CurriculumTerm } from '@/lib/curriculum';
import type { ChildOnlineScheduleSlotWithLesson } from '@/lib/online-learning';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

const DAYS: { value: string; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];
const DAY_LABEL = new Map(DAYS.map((d) => [d.value, d.label]));

async function apiCall(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** Manages one online-enabled student's individual programme (which curriculum_terms they're
 * assigned -- independent of their class_name, since an online student can work ahead or on a
 * different subject entirely) and their weekly timetable of recurring slots, each resolving
 * dynamically to whichever lesson in that term they haven't completed yet. */
export default function OnlineStudentManager({
  childId,
  allTerms,
  initialProgramme,
  initialSchedule,
}: {
  childId: number;
  allTerms: CurriculumTerm[];
  initialProgramme: CurriculumTerm[];
  initialSchedule: ChildOnlineScheduleSlotWithLesson[];
}) {
  const [programme, setProgramme] = useState(initialProgramme);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [error, setError] = useState<string | null>(null);

  const availableTerms = allTerms.filter((t) => !programme.some((p) => p.id === t.id));

  const [addTermId, setAddTermId] = useState<number | ''>('');
  const [addingTerm, setAddingTerm] = useState(false);

  async function addTerm() {
    if (!addTermId) return;
    setAddingTerm(true);
    setError(null);
    const { ok, data } = await apiCall(`/api/admin/online-learning/students/${childId}/programme`, 'POST', { termId: addTermId });
    setAddingTerm(false);
    if (!ok) {
      setError((data.error as string) || 'Could not add that programme.');
      return;
    }
    // String(...): curriculum_terms.id comes back from the driver as a string despite its
    // `number` type, so a plain === against addTermId (a real JS number from the <select>) would
    // never match.
    const term = allTerms.find((t) => String(t.id) === String(addTermId));
    if (term) setProgramme((prev) => [...prev, term]);
    setAddTermId('');
  }

  async function removeTerm(termId: number) {
    setError(null);
    const { ok, data } = await apiCall(`/api/admin/online-learning/students/${childId}/programme/${termId}`, 'DELETE');
    if (!ok) {
      setError((data.error as string) || 'Could not remove that programme.');
      return;
    }
    setProgramme((prev) => prev.filter((t) => t.id !== termId));
    // Removing a term also drops any schedule slots for it server-side (see removeChildOnlineTerm) --
    // mirror that locally so the timetable doesn't show a slot for a programme no longer assigned.
    setSchedule((prev) => prev.filter((s) => s.curriculum_term_id !== termId));
  }

  async function refreshSchedule() {
    const { ok, data } = await apiCall(`/api/admin/online-learning/students/${childId}/schedule`, 'GET');
    if (ok) setSchedule(data.slots as ChildOnlineScheduleSlotWithLesson[]);
  }

  const [slotTermId, setSlotTermId] = useState<number | ''>('');
  const [slotDay, setSlotDay] = useState('monday');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('10:00');
  const [slotLabel, setSlotLabel] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);

  async function addSlot() {
    if (!slotTermId) return;
    setAddingSlot(true);
    setError(null);
    const { ok, data } = await apiCall(`/api/admin/online-learning/students/${childId}/schedule`, 'POST', {
      curriculumTermId: slotTermId,
      dayOfWeek: slotDay,
      startTime: slotStart,
      endTime: slotEnd,
      label: slotLabel || null,
    });
    setAddingSlot(false);
    if (!ok) {
      setError((data.error as string) || 'Could not add that slot.');
      return;
    }
    setSlotLabel('');
    await refreshSchedule();
  }

  async function removeSlot(slotId: number) {
    setError(null);
    const { ok, data } = await apiCall(`/api/admin/online-learning/students/${childId}/schedule/${slotId}`, 'DELETE');
    if (!ok) {
      setError((data.error as string) || 'Could not remove that slot.');
      return;
    }
    setSchedule((prev) => prev.filter((s) => s.id !== slotId));
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="font-semibold text-orange-deep">{error}</p>}

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Programme</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Which curriculum programmes this student follows online -- not limited to their own class, so they can
          work ahead, catch up, or follow a different subject&apos;s programme entirely.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {programme.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line p-2 text-sm">
              <span>
                <span className="font-semibold text-ink">{t.subject}</span>
                <span className="ml-2 text-xs text-ink-soft">{t.class_name} · {t.term_label}</span>
              </span>
              <button type="button" onClick={() => removeTerm(t.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            </li>
          ))}
          {programme.length === 0 && <li className="text-sm text-ink-soft">No programme assigned yet.</li>}
        </ul>
        {availableTerms.length > 0 && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label="Add a programme" htmlFor="add-term">
              <select
                id="add-term"
                value={addTermId}
                onChange={(e) => setAddTermId(e.target.value ? Number(e.target.value) : '')}
                className="rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm"
              >
                <option value="">Choose…</option>
                {availableTerms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.class_name} · {t.subject} · {t.term_label}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="button" variant="primary" onClick={addTerm} disabled={!addTermId || addingTerm}>
              {addingTerm ? 'Adding…' : 'Add'}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Weekly online timetable</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Each slot points at a programme, not a fixed lesson -- the student always lands on whichever lesson in
          that programme they haven&apos;t completed yet, so nothing needs updating as they move through it.
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {schedule.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line p-2 text-sm">
              <span>
                <span className="font-semibold text-ink">{DAY_LABEL.get(s.day_of_week) ?? s.day_of_week}</span>
                <span className="ml-2 text-ink-soft">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
                <span className="ml-2 font-semibold text-teal-deep">{s.label || s.subject}</span>
                <span className="ml-2 text-xs text-ink-soft">
                  {s.nextLesson
                    ? s.nextLesson.allCompleted
                      ? `All lessons completed (last: ${s.nextLesson.lessonTitle})`
                      : `Next: ${s.nextLesson.lessonTitle}`
                    : 'No published lessons in this programme yet'}
                </span>
              </span>
              <button type="button" onClick={() => removeSlot(s.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            </li>
          ))}
          {schedule.length === 0 && <li className="text-sm text-ink-soft">No slots yet.</li>}
        </ul>

        {programme.length === 0 ? (
          <p className="mt-3 text-xs text-ink-soft">Assign a programme above before adding timetable slots.</p>
        ) : (
          <div className="mt-3 grid gap-3 rounded-sm border border-dashed border-sand-line p-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Day" htmlFor="slot-day">
              <select id="slot-day" value={slotDay} onChange={(e) => setSlotDay(e.target.value)} className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm">
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Start" htmlFor="slot-start">
              <input id="slot-start" type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm" />
            </Field>
            <Field label="End" htmlFor="slot-end">
              <input id="slot-end" type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm" />
            </Field>
            <Field label="Programme" htmlFor="slot-term">
              <select
                id="slot-term"
                value={slotTermId}
                onChange={(e) => setSlotTermId(e.target.value ? Number(e.target.value) : '')}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Choose…</option>
                {programme.map((t) => (
                  <option key={t.id} value={t.id}>{t.subject}</option>
                ))}
              </select>
            </Field>
            <Field label="Label (optional)" htmlFor="slot-label">
              <TextInput id="slot-label" value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} placeholder="e.g. Maths" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-5">
              <Button type="button" variant="primary" onClick={addSlot} disabled={!slotTermId || addingSlot}>
                {addingSlot ? 'Adding…' : 'Add slot'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Link href="/admin/teaching/curriculum-plans" className="text-sm font-semibold text-teal-deep hover:underline">
        Edit lesson content (video, worksheet, quiz) in Curriculum Plans →
      </Link>
    </div>
  );
}
