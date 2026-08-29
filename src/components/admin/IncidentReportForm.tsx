'use client';

import { useMemo, useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';
import { formatDateTime } from '@/lib/admin-format';
import { INCIDENT_TYPE_LABELS, INJURY_SEVERITY_LABELS, type IncidentReportRow } from '@/lib/incident-reports';
import { INCIDENT_TYPES, INJURY_SEVERITIES } from '@/lib/validation';

const selectClasses =
  'w-full rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

const STATUS_LABEL: Record<string, string> = { open: 'Open', in_review: 'In review', closed: 'Closed' };
const STATUS_CLASS: Record<string, string> = {
  open: 'bg-orange/15 text-orange-deep',
  in_review: 'bg-lightteal/20 text-teal-deep',
  closed: 'bg-teal/15 text-teal-deep',
};

function nowForInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function IncidentReportForm({
  childOptions,
  initial,
}: {
  childOptions: { id: number; label: string; class_name: string | null }[];
  initial: IncidentReportRow[];
}) {
  const [history, setHistory] = useState(initial);
  const [incidentType, setIncidentType] = useState('');
  const [childId, setChildId] = useState('');
  const [className, setClassName] = useState('');
  const [location, setLocation] = useState('');
  const [occurredAt, setOccurredAt] = useState(nowForInput());
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [injurySeverity, setInjurySeverity] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [parentNotified, setParentNotified] = useState(false);

  const { status, errorMessage, submit, reset } = useFormSubmit<{ id: number }>('/api/admin/incidents');

  const showInjuryField = incidentType === 'first_aid_injury' || incidentType === 'child_incident';
  const showParentNotified = Boolean(childId) || incidentType === 'child_incident' || incidentType === 'first_aid_injury';

  const selectedChild = useMemo(() => childOptions.find((c) => String(c.id) === childId), [childOptions, childId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!incidentType) return;
    const result = await submit({
      incidentType,
      childId: childId ? Number(childId) : null,
      className: className || selectedChild?.class_name || null,
      location: location || null,
      occurredAt,
      description,
      actionTaken: actionTaken || null,
      witnesses: witnesses || null,
      injurySeverity: showInjuryField && injurySeverity ? injurySeverity : null,
      followUpRequired,
      parentNotified,
    });
    if (result) {
      setHistory((prev) => [
        {
          id: result.id,
          incident_type: incidentType,
          child_full_name: selectedChild?.label ?? null,
          class_name: className || selectedChild?.class_name || null,
          location: location || null,
          occurred_at: occurredAt,
          description,
          action_taken: actionTaken || null,
          witnesses: witnesses || null,
          injury_severity: showInjuryField && injurySeverity ? injurySeverity : null,
          follow_up_required: followUpRequired,
          parent_notified: parentNotified,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setIncidentType('');
      setChildId('');
      setClassName('');
      setLocation('');
      setOccurredAt(nowForInput());
      setDescription('');
      setActionTaken('');
      setWitnesses('');
      setInjurySeverity('');
      setFollowUpRequired(false);
      setParentNotified(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">File a report</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Covers hazards, child-related incidents, first aid or injuries, and near misses. File it as soon as
          you can after it happens — the school office reviews every report.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Type of report" htmlFor="ir-type" required>
            <select id="ir-type" required value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className={selectClasses}>
              <option value="" disabled>
                Select a type
              </option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {INCIDENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="When did this happen?" htmlFor="ir-occurred" required>
            <input
              id="ir-occurred"
              type="datetime-local"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className={selectClasses}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {childOptions.length > 0 && (
            <Field label="Child involved (optional)" htmlFor="ir-child">
              <select id="ir-child" value={childId} onChange={(e) => setChildId(e.target.value)} className={selectClasses}>
                <option value="">Not about a specific child</option>
                {childOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                    {c.class_name ? ` (${c.class_name})` : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Location" htmlFor="ir-location">
            <TextInput id="ir-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Playground, Padel court, Classroom 2" />
          </Field>
        </div>

        {!selectedChild && (
          <div className="mt-4">
            <Field label="Class (optional, if not tied to one child)" htmlFor="ir-class">
              <TextInput id="ir-class" value={className} onChange={(e) => setClassName(e.target.value)} />
            </Field>
          </div>
        )}

        <div className="mt-4">
          <Field label="What happened?" htmlFor="ir-description" required>
            <TextArea
              id="ir-description"
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, who was involved, and how it was noticed."
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Action taken" htmlFor="ir-action">
            <TextArea
              id="ir-action"
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. First aid given, area cordoned off, parent called..."
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Witnesses (optional)" htmlFor="ir-witnesses">
            <TextInput id="ir-witnesses" value={witnesses} onChange={(e) => setWitnesses(e.target.value)} placeholder="Names of staff/others present" />
          </Field>
          {showInjuryField && (
            <Field label="Injury severity" htmlFor="ir-severity">
              <select id="ir-severity" value={injurySeverity} onChange={(e) => setInjurySeverity(e.target.value)} className={selectClasses}>
                <option value="">Not specified</option>
                {INJURY_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {INJURY_SEVERITY_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={followUpRequired} onChange={(e) => setFollowUpRequired(e.target.checked)} className="h-4 w-4" />
            Follow-up required
          </label>
          {showParentNotified && (
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" checked={parentNotified} onChange={(e) => setParentNotified(e.target.checked)} className="h-4 w-4" />
              Parent has been notified
            </label>
          )}
        </div>

        <div className="mt-5">
          <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="Report filed — the school office has been notified." />
        </div>
        <div className="mt-4">
          <Button type="submit" variant="primary" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Filing…' : 'File report'}
          </Button>
          {status === 'error' && (
            <button type="button" onClick={reset} className="ml-3 text-sm font-semibold text-ink-soft hover:underline">
              Dismiss
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Reports you&apos;ve filed</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Nothing filed yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {history.map((item) => (
              <li key={item.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">
                    {INCIDENT_TYPE_LABELS[item.incident_type] ?? item.incident_type}
                    {item.child_full_name ? ` · ${item.child_full_name}` : item.class_name ? ` · ${item.class_name}` : ''}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
                <p className="mt-2 text-xs text-ink-soft">{formatDateTime(item.occurred_at)}{item.location ? ` · ${item.location}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
