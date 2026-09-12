'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { DAY_ORDER, DAY_LABELS, DUTY_TYPE_LABELS, DUTY_PRESETS, type DutyRosterRow, type DutyType } from '@/lib/duty-roster';
import type { DayOfWeek } from '@/lib/class-schedule';

export interface StaffOption {
  id: number;
  label: string;
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function DutyRosterManager({
  initial,
  staffOptions,
  missingNonContact,
}: {
  initial: DutyRosterRow[];
  staffOptions: StaffOption[];
  missingNonContact: { id: number; label: string }[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [staffId, setStaffId] = useState(staffOptions[0] ? String(staffOptions[0].id) : '');
  const [dutyType, setDutyType] = useState<DutyType>('welcome_to_school');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:30');
  const [label, setLabel] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(preset: (typeof DUTY_PRESETS)[number]) {
    setDutyType(preset.dutyType);
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
  }

  async function add() {
    if (!staffId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/duty-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: Number(staffId),
          dutyType,
          dayOfWeek,
          startTime,
          endTime,
          label: label.trim() || null,
          location: location.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add that duty.');
      const staffLabel = staffOptions.find((s) => s.id === Number(staffId))?.label ?? 'Staff member';
      setEntries((prev) => [
        ...prev,
        {
          id: data.id,
          admin_user_id: Number(staffId),
          staff_label: staffLabel,
          duty_type: dutyType,
          day_of_week: dayOfWeek,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          label: label.trim() || null,
          location: location.trim() || null,
        },
      ]);
      setLabel('');
      setLocation('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that duty.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/admin/duty-roster/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  const staffRows = useMemo(() => {
    const byStaff = new Map<number, { id: number; label: string; entries: DutyRosterRow[] }>();
    for (const e of entries) {
      const existing = byStaff.get(e.admin_user_id);
      if (existing) existing.entries.push(e);
      else byStaff.set(e.admin_user_id, { id: e.admin_user_id, label: e.staff_label, entries: [e] });
    }
    return [...byStaff.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  const daysPresent = DAY_ORDER.filter((day) => entries.some((e) => e.day_of_week === day));
  const displayDays = daysPresent.length > 0 ? daysPresent : (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]);

  return (
    <div className="flex flex-col gap-6">
      {missingNonContact.length > 0 && (
        <div className="rounded-md border border-orange/40 bg-orange/10 px-4 py-3 text-sm text-orange-deep">
          <span className="font-semibold">No non-contact/admin time booked yet for:</span>{' '}
          {missingNonContact.map((s) => s.label).join(', ')}.
        </div>
      )}

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Assign a duty</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DUTY_PRESETS.map((preset) => (
            <button
              key={preset.dutyType}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                dutyType === preset.dutyType ? 'border-teal bg-teal/10 text-teal-deep' : 'border-sand-line text-ink-soft hover:border-teal'
              }`}
            >
              {preset.label} ({formatTime(preset.startTime)}–{formatTime(preset.endTime)})
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Staff member" htmlFor="dr-staff" required>
            <select
              id="dr-staff"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Duty type" htmlFor="dr-type" required>
            <select
              id="dr-type"
              value={dutyType}
              onChange={(e) => setDutyType(e.target.value as DutyType)}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              {(Object.keys(DUTY_TYPE_LABELS) as DutyType[]).map((t) => (
                <option key={t} value={t}>{DUTY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Day" htmlFor="dr-day" required>
            <select
              id="dr-day"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </Field>
          <Field label="Start time" htmlFor="dr-start" required>
            <TextInput id="dr-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End time" htmlFor="dr-end" required>
            <TextInput id="dr-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
          <Field label="Label (optional)" htmlFor="dr-label">
            <TextInput id="dr-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Front gate" />
          </Field>
          <Field label="Location (optional)" htmlFor="dr-location">
            <TextInput id="dr-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Playground" />
          </Field>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
        <div className="mt-4">
          <Button type="button" variant="primary" onClick={add} disabled={saving || !staffId || !startTime || !endTime}>
            {saving ? 'Saving…' : 'Add to roster'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-teal-deep">Weekly Duty Roster</h2>
        {staffRows.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No duties assigned yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-md border border-sand-line">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-sand/40">
                  <th className="border border-sand-line px-3 py-2 text-left font-bold text-ink-soft">Staff</th>
                  {displayDays.map((day) => (
                    <th key={day} className="border border-sand-line px-3 py-2 text-left font-bold text-ink-soft">
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffRows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap border border-sand-line bg-sand/20 px-3 py-2 align-top font-semibold text-ink">
                      {row.label}
                    </td>
                    {displayDays.map((day) => {
                      const dayEntries = row.entries.filter((e) => e.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
                      return (
                        <td key={day} className="border border-sand-line p-2 align-top">
                          <div className="flex flex-col gap-1.5">
                            {dayEntries.map((e) => (
                              <div key={e.id} className="group flex items-start justify-between gap-2 rounded-sm bg-teal/10 px-2 py-1 text-xs">
                                <div>
                                  <p className="font-semibold text-teal-deep">{DUTY_TYPE_LABELS[e.duty_type]}</p>
                                  <p className="text-ink-soft">
                                    {formatTime(e.start_time)}–{formatTime(e.end_time)}
                                    {e.location ? ` · ${e.location}` : ''}
                                  </p>
                                  {e.label && <p className="text-ink-soft">{e.label}</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => remove(e.id)}
                                  className="text-orange-deep opacity-0 transition-opacity group-hover:opacity-100"
                                  aria-label="Remove duty"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
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
    </div>
  );
}
