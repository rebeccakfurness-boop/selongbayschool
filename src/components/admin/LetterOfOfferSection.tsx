import Link from 'next/link';
import type { LetterOfOfferSummaryRow } from '@/lib/letters-of-offer';
import type { MeetingInviteSummaryRow } from '@/lib/meeting-scheduling';
import SendLetterOfOfferButton from '@/components/admin/SendLetterOfOfferButton';
import ScheduleMeetingButton from '@/components/admin/ScheduleMeetingButton';
import { formatDate, formatDateTime } from '@/lib/admin-format';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-black/10 text-ink-soft',
  sent: 'bg-orange/20 text-orange-deep',
  accepted: 'bg-teal/15 text-teal-deep',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent — awaiting acceptance',
  accepted: 'Accepted',
};

/** Meeting invites are one-to-many per letter (re-sending creates a new row) — invites are already
 * ordered newest-first by getMeetingInvitesForChild, so the first match here is the current one. */
function latestInviteForLetter(invites: MeetingInviteSummaryRow[], letterId: number): MeetingInviteSummaryRow | undefined {
  return invites.find((invite) => invite.letter_of_offer_id === letterId);
}

function MeetingStatus({ invite }: { invite: MeetingInviteSummaryRow | undefined }) {
  if (!invite) return null;
  if (invite.status === 'booked' && invite.booked_start) {
    return (
      <div className="mt-1 w-full text-xs text-ink-soft">
        Meeting: {formatDateTime(invite.booked_start)} — {invite.meeting_format === 'video' ? 'video call' : 'in person'}
        {invite.meeting_format === 'video' && invite.meet_link && (
          <>
            {' · '}
            <a href={invite.meet_link} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
              Join link
            </a>
          </>
        )}
      </div>
    );
  }
  if (invite.status === 'sent') {
    return <div className="mt-1 w-full text-xs text-ink-soft">Meeting invite sent to {invite.parent_email} — awaiting a time.</div>;
  }
  return null;
}

export default function LetterOfOfferSection({
  childId,
  letters,
  canEdit,
  defaultEmail,
  hasInvoices,
  meetingInvites,
}: {
  childId: number;
  letters: LetterOfOfferSummaryRow[];
  canEdit: boolean;
  defaultEmail: string;
  hasInvoices: boolean;
  meetingInvites: MeetingInviteSummaryRow[];
}) {
  const acceptedLetter = letters.find((l) => l.status === 'accepted');
  const generalMeetingInvite = meetingInvites.find((invite) => invite.letter_of_offer_id === null);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Letter of Offer</h3>
        {canEdit && (
          <Link href={`/admin/families/${childId}/letter-of-offer/new`} className="text-sm font-semibold text-teal-deep hover:underline">
            + New letter of offer
          </Link>
        )}
      </div>

      {acceptedLetter && !hasInvoices && canEdit && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-sm bg-orange/10 px-3 py-2 text-sm">
          <span className="font-semibold text-orange-deep">
            Offer accepted{acceptedLetter.accepted_by_name ? ` by ${acceptedLetter.accepted_by_name}` : ''} — send the tuition invoice.
          </span>
          <Link href={`/admin/families/${childId}/invoices/new?type=tuition`} className="whitespace-nowrap text-xs font-bold text-teal-deep hover:underline">
            Create tuition invoice →
          </Link>
        </div>
      )}

      {/* Not tied to any specific letter — sent automatically the moment the Student Enrolment
          Form came in, before there's a letter to attach it to. Shown here regardless, since this
          is still the natural place staff look for meeting status on this family. */}
      {generalMeetingInvite && (
        <div className="mt-3 rounded-sm border border-sand-line px-3 py-2 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Meeting (from enrolment form)</span>
          <MeetingStatus invite={generalMeetingInvite} />
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {letters.map((letter) => {
          const invite = latestInviteForLetter(meetingInvites, letter.id);
          return (
            <li key={letter.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
              <div>
                <a href={`/api/letters-of-offer/${letter.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                  Letter of Offer
                </a>
                <span className="ml-2 text-xs text-ink-soft">Start {formatDate(letter.start_date)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[letter.status]}`}>
                  {STATUS_LABELS[letter.status]}
                </span>
                {canEdit && letter.status !== 'accepted' && <SendLetterOfOfferButton letterId={letter.id} defaultEmail={defaultEmail} />}
                {canEdit && invite?.status !== 'booked' && (
                  <ScheduleMeetingButton
                    endpoint={`/api/admin/letters-of-offer/${letter.id}/schedule-meeting`}
                    defaultEmail={defaultEmail}
                    initiallySent={invite?.status === 'sent'}
                  />
                )}
                {canEdit && letter.status !== 'accepted' && (
                  <Link href={`/admin/letters-of-offer/${letter.id}/edit`} className="text-xs font-semibold text-teal-deep hover:underline">
                    Edit
                  </Link>
                )}
              </div>
              <MeetingStatus invite={invite} />
            </li>
          );
        })}
        {letters.length === 0 && <li className="text-sm text-ink-soft">No letters of offer yet.</li>}
      </ul>
    </div>
  );
}
