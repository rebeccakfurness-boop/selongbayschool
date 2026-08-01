'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function CalendarConnectionManager({ connectionEmail }: { connectionEmail: string }) {
  const router = useRouter();

  async function disconnect() {
    if (!confirm('Disconnect Google Calendar? Meetings already booked stay on the calendar, but no new meeting-scheduling emails can be sent until reconnected.')) return;
    await fetch('/api/admin/calendar/disconnect', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Connected as <span className="font-semibold text-ink">{connectionEmail}</span>
        </p>
        <Button type="button" variant="ghost" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
