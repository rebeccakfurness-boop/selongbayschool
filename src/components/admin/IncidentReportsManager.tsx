'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkReadButton from '@/components/admin/MarkReadButton';
import { formatDateTime } from '@/lib/admin-format';
import {
  INCIDENT_TYPE_LABELS,
  INJURY_SEVERITY_LABELS,
  type AdminIncidentReportRow,
  type IncidentStatus,
} from '@/lib/incident-reports';

const selectClasses =
  'rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

const STATUS_LABEL: Record<IncidentStatus, string> = { open: 'Open', in_review: 'In review', closed: 'Closed' };

function flaggedFor(item: AdminIncidentReportRow): boolean {
  return item.incident_type === 'child_incident' || (item.incident_type === 'first_aid_injury' && (item.injury_severity === 'moderate' || item.injury_severity === 'severe'));
}

function Row({ item }: { item: AdminIncidentReportRow }) {
  const router = useRouter();
  const [status, setStatus] = useState<IncidentStatus>(item.status);
  const [notes, setNotes] = useState(item.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save(patch: { status?: IncidentStatus; adminNotes?: string }) {
    setSaving(true);
    try {
      await fetch(`/api/admin/incidents/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const flagged = flaggedFor(item);

  return (
    <div
      className={`rounded-md border p-5 shadow-soft ${flagged ? 'border-orange-deep/50 bg-orange/5' : 'border-sand-line bg-paper'} ${
        item.is_read ? '' : 'ring-2 ring-orange-deep/30'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {flagged && <span className="rounded-full bg-orange-deep px-2.5 py-0.5 text-xs font-bold text-white">FLAGGED</span>}
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal-deep">
              {INCIDENT_TYPE_LABELS[item.incident_type] ?? item.incident_type}
            </span>
            {!item.is_read && <span className="rounded-full bg-orange/20 px-2.5 py-0.5 text-xs font-bold text-orange-deep">New</span>}
          </div>
          <p className="mt-2 font-display text-base font-semibold text-ink">
            Filed by {item.reporter_name || item.reporter_email}{' '}
            <span className="font-sans text-sm font-normal text-ink-soft">({item.reporter_email})</span>
          </p>
          {(item.child_full_name || item.class_name) && (
            <p className="text-xs text-ink-soft">{item.child_full_name || item.class_name}</p>
          )}
          <p className="text-xs text-ink-soft">
            {formatDateTime(item.occurred_at)}
            {item.location ? ` · ${item.location}` : ''}
          </p>
        </div>
        <MarkReadButton id={item.id} isRead={item.is_read} endpoint="/api/admin/incidents" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">What happened</p>
          <p className="mt-1 text-sm text-ink">{item.description}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Action taken</p>
          <p className="mt-1 text-sm text-ink">{item.action_taken || <span className="text-ink-soft">Not specified</span>}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
        {item.witnesses && <span>Witnesses: {item.witnesses}</span>}
        {item.injury_severity && <span>Severity: {INJURY_SEVERITY_LABELS[item.injury_severity] ?? item.injury_severity}</span>}
        <span>Follow-up required: {item.follow_up_required ? 'Yes' : 'No'}</span>
        <span>Parent notified: {item.parent_notified ? 'Yes' : 'No'}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand-line pt-4">
        <div>
          <label htmlFor={`status-${item.id}`} className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Status
          </label>
          <select
            id={`status-${item.id}`}
            value={status}
            onChange={(e) => {
              const next = e.target.value as IncidentStatus;
              setStatus(next);
              save({ status: next });
            }}
            className={`mt-1 ${selectClasses}`}
          >
            {(Object.keys(STATUS_LABEL) as IncidentStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[240px] flex-1">
          <label htmlFor={`notes-${item.id}`} className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Internal notes
          </label>
          <textarea
            id={`notes-${item.id}`}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => save({ adminNotes: notes })}
            className="mt-1 w-full rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <span className="text-xs text-ink-soft">{saving ? 'Saving…' : savedAt ? 'Saved.' : ''}</span>
      </div>
    </div>
  );
}

export default function IncidentReportsManager({ initial }: { initial: AdminIncidentReportRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {initial.map((item) => (
        <Row key={item.id} item={item} />
      ))}
      {initial.length === 0 && (
        <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
          No incident reports filed yet.
        </div>
      )}
    </div>
  );
}
