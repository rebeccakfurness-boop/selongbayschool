import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ensureSchema } from '@/lib/db';
import { getMeetingInviteByToken, computeAvailableSlots } from '@/lib/meeting-scheduling';
import { getFreeBusy } from '@/lib/google-calendar';
import { formatDateTime } from '@/lib/admin-format';
import { siteConfig } from '@/lib/site-content';
import ScheduleMeetingForm from '@/components/ScheduleMeetingForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Schedule a Meeting',
  description: 'Choose a time to meet with Selong Bay School.',
};

export default async function ScheduleMeetingPage({ params }: { params: Promise<{ token: string }> }) {
  await ensureSchema();
  const { token } = await params;
  const invite = await getMeetingInviteByToken(token);
  if (!invite) notFound();

  if (invite.status === 'booked' && invite.booked_start) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 md:px-8 md:py-20">
        <p className="font-script text-3xl text-orange-deep">Meeting confirmed</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">{invite.child_full_name}</h1>
        <div className="mt-6 rounded-md border border-teal/30 bg-teal/10 p-6">
          <p className="font-display text-lg font-semibold text-teal-deep">{formatDateTime(invite.booked_start)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {invite.meeting_format === 'video'
              ? invite.meet_link
                ? <>Video call: join at the scheduled time via <a href={invite.meet_link} className="font-semibold text-teal-deep underline">this link</a>.</>
                : 'Video call.'
              : `In person at ${siteConfig.contact.address}.`}
          </p>
          <p className="mt-4 text-sm text-ink-soft">
            Need to change this? Reply to your confirmation email or contact us at {siteConfig.contact.email}.
          </p>
        </div>
      </div>
    );
  }

  if (invite.status === 'cancelled') {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center md:px-8 md:py-20">
        <h1 className="font-display text-2xl font-semibold text-ink">This invite is no longer active</h1>
        <p className="mt-3 text-sm text-ink-soft">Please contact us at {siteConfig.contact.email} to arrange a meeting.</p>
      </div>
    );
  }

  let slots: { startIso: string; endIso: string }[] = [];
  let loadError: string | null = null;
  try {
    const timeMin = new Date();
    const timeMax = new Date(timeMin.getTime() + 21 * 24 * 3600 * 1000);
    const busy = await getFreeBusy(timeMin.toISOString(), timeMax.toISOString());
    slots = computeAvailableSlots(busy, timeMin);
  } catch (err) {
    console.error('[schedule-meeting] failed to load availability', err);
    loadError = 'Could not load available times right now.';
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-20">
      <p className="font-script text-3xl text-orange-deep">Schedule a Meeting</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">{invite.child_full_name}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Pick a time that suits you: in person on campus, or over a video call. All times shown are Lombok time.
      </p>

      {loadError ? (
        <p className="mt-6 rounded-md border border-orange/30 bg-orange/10 p-6 text-sm font-semibold text-orange-deep">
          {loadError} Please contact us at {siteConfig.contact.email} to arrange a time instead.
        </p>
      ) : (
        <ScheduleMeetingForm token={token} slots={slots} location={siteConfig.contact.address} />
      )}
    </div>
  );
}
