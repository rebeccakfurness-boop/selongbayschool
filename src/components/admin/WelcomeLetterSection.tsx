import type { WelcomeLetterSummaryRow } from '@/lib/welcome-letters';
import SendWelcomeLetterButton from '@/components/admin/SendWelcomeLetterButton';
import { formatDate } from '@/lib/admin-format';

const SENT_BY_LABELS: Record<string, string> = {
  auto: 'Sent automatically (3 days before start)',
  admin: 'Sent manually',
};

export default function WelcomeLetterSection({
  childId,
  letter,
  canEdit,
  defaultEmail,
}: {
  childId: number;
  letter: WelcomeLetterSummaryRow | null;
  canEdit: boolean;
  defaultEmail: string;
}) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Welcome Letter</h3>
        {canEdit && (
          <SendWelcomeLetterButton childId={childId} defaultEmail={defaultEmail} label={letter ? 'Send now' : '+ Send welcome letter'} />
        )}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        What to bring on the first day, the daily schedule, and key contacts. Sent automatically 3 days before the
        enrolment date, or any time from here.
      </p>

      {letter ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
          <span className="text-xs text-ink-soft">Sent {formatDate(letter.sent_at.slice(0, 10))}</span>
          <span className="whitespace-nowrap rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">
            {SENT_BY_LABELS[letter.sent_by]}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">Not sent yet.</p>
      )}
    </div>
  );
}
