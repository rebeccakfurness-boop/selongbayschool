'use client';

import { useState } from 'react';
import type { SessionOccurrenceRow } from '@/lib/schedule';
import OccurrenceScheduleBoard from '@/components/OccurrenceScheduleBoard';

/** Owns the reminder-toggle round trip so OccurrenceScheduleBoard can stay a plain presentational
 * component reused by both the parent and (read-only, no toggle) student views. */
export default function ParentScheduleSection({
  childId,
  title,
  occurrences,
  initialNotificationsEnabled,
}: {
  childId: number;
  title: string;
  occurrences: SessionOccurrenceRow[];
  initialNotificationsEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialNotificationsEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle(next: boolean) {
    setEnabled(next);
    setSaving(true);
    try {
      const res = await fetch('/api/account/schedule/notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, enabled: next }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch {
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OccurrenceScheduleBoard
      occurrences={occurrences}
      title={title}
      emptyMessage="No sessions in the next two weeks. If term dates haven't been set up yet, check back once the school has confirmed this term's calendar."
      notifications={{ enabled, onToggle: toggle, saving }}
      worksheetContext={{ childId, role: 'parent' }}
    />
  );
}
