'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkReadButton from '@/components/admin/MarkReadButton';
import { formatDateTime } from '@/lib/admin-format';
import { FEEDBACK_CATEGORY_LABELS, type AdminParentFeedbackRow, type FeedbackStatus } from '@/lib/parent-feedback';

const selectClasses =
  'rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

const STATUS_LABEL: Record<FeedbackStatus, string> = { new: 'New', in_review: 'In review', resolved: 'Resolved' };

function Row({ item }: { item: AdminParentFeedbackRow }) {
  const router = useRouter();
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [notes, setNotes] = useState(item.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save(patch: { status?: FeedbackStatus; adminNotes?: string }) {
    setSaving(true);
    try {
      await fetch(`/api/admin/feedback/${item.id}`, {
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

  return (
    <div
      className={`rounded-md border p-5 shadow-soft ${
        item.urgent ? 'border-orange-deep/50 bg-orange/5' : 'border-sand-line bg-paper'
      } ${item.is_read ? '' : 'ring-2 ring-orange-deep/30'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {item.urgent && (
              <span className="rounded-full bg-orange-deep px-2.5 py-0.5 text-xs font-bold text-white">URGENT</span>
            )}
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal-deep">
              {FEEDBACK_CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            {!item.is_read && <span className="rounded-full bg-orange/20 px-2.5 py-0.5 text-xs font-bold text-orange-deep">New</span>}
          </div>
          <p className="mt-2 font-display text-base font-semibold text-ink">
            {item.parent_name || item.parent_email} <span className="font-sans text-sm font-normal text-ink-soft">({item.parent_email})</span>
          </p>
          {item.child_full_name && <p className="text-xs text-ink-soft">About: {item.child_full_name}</p>}
          <p className="text-xs text-ink-soft">{formatDateTime(item.created_at)}</p>
        </div>
        <MarkReadButton id={item.id} isRead={item.is_read} endpoint="/api/admin/feedback" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">What&apos;s concerning them</p>
          <p className="mt-1 text-sm text-ink">{item.description}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">What they&apos;d like done</p>
          <p className="mt-1 text-sm text-ink">{item.desired_outcome || <span className="text-ink-soft">Not specified</span>}</p>
        </div>
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
              const next = e.target.value as FeedbackStatus;
              setStatus(next);
              save({ status: next });
            }}
            className={`mt-1 ${selectClasses}`}
          >
            {(Object.keys(STATUS_LABEL) as FeedbackStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[240px] flex-1">
          <label htmlFor={`notes-${item.id}`} className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Internal notes (not shared with the parent)
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

export default function ParentFeedbackManager({ initial }: { initial: AdminParentFeedbackRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {initial.map((item) => (
        <Row key={item.id} item={item} />
      ))}
      {initial.length === 0 && (
        <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
          No feedback submitted yet.
        </div>
      )}
    </div>
  );
}
