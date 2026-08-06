import type { OffboardingLetterSummaryRow } from '@/lib/offboarding';
import SendOffboardingLetterButton from '@/components/admin/SendOffboardingLetterButton';
import { formatDate } from '@/lib/admin-format';

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-orange/20 text-orange-deep',
  completed: 'bg-teal/15 text-teal-deep',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Sent — awaiting response',
  completed: 'Survey completed',
};

/** Standard NPS bucketing: 9-10 promoter, 7-8 passive, 0-6 detractor. */
function recommendStyle(score: number): { label: string; className: string } {
  if (score >= 9) return { label: 'Promoter', className: 'bg-teal/15 text-teal-deep' };
  if (score >= 7) return { label: 'Passive', className: 'bg-sand text-ink-soft' };
  return { label: 'Detractor', className: 'bg-orange-deep/20 text-orange-deep' };
}

function SurveyResults({ letter }: { letter: OffboardingLetterSummaryRow }) {
  if (letter.experience_rating === null || letter.recommend_score === null) return null;
  const recommend = recommendStyle(letter.recommend_score);
  return (
    <div className="mt-2 w-full rounded-sm border border-sand-line bg-cream/50 px-3 py-2 text-xs text-ink">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          <span className="font-bold">Experience:</span> {'★'.repeat(letter.experience_rating)}
          {'☆'.repeat(5 - letter.experience_rating)} ({letter.experience_rating}/5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold">Recommend:</span> {letter.recommend_score}/10
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${recommend.className}`}>{recommend.label}</span>
        </span>
        <span>
          <span className="font-bold">Marketing use:</span> {letter.marketing_consent ? 'Yes' : 'No'}
        </span>
      </div>
      {letter.feedback_text && <p className="mt-1.5 italic text-ink-soft">&ldquo;{letter.feedback_text}&rdquo;</p>}
      {letter.completed_by_name && <p className="mt-1 text-ink-soft">— {letter.completed_by_name}</p>}
    </div>
  );
}

export default function OffboardingLetterSection({
  childId,
  letters,
  canEdit,
  defaultEmail,
}: {
  childId: number;
  letters: OffboardingLetterSummaryRow[];
  canEdit: boolean;
  defaultEmail: string;
}) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Off-boarding Letter</h3>
        {canEdit && <SendOffboardingLetterButton childId={childId} defaultEmail={defaultEmail} />}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        A thank-you note for a family leaving the school, with a short exit survey (experience rating, likelihood
        to recommend, and feedback).
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {letters.map((letter) => (
          <li key={letter.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
            <span className="text-xs text-ink-soft">Sent {formatDate(letter.sent_at.slice(0, 10))}</span>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[letter.status]}`}>
              {STATUS_LABELS[letter.status]}
            </span>
            <SurveyResults letter={letter} />
          </li>
        ))}
        {letters.length === 0 && <li className="text-sm text-ink-soft">No off-boarding letter sent yet.</li>}
      </ul>
    </div>
  );
}
