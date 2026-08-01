import { randomBytes } from 'crypto';
import { sql } from './db';
import type { BusyPeriod } from './google-calendar';

/** All adjustable defaults for the meeting-booking window live here in one place, same pattern as
 * COMPLIANCE_STALE_AFTER_DAYS in child-lifecycle-shared.ts — a reasonable starting point, not
 * something the school specifically requested, easy to tune once real usage shows what fits. */
export const MEETING_DURATION_MINUTES = 30;
export const MEETING_WINDOW_DAYS = 14;
export const MEETING_LEAD_HOURS = 24;
const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 15;
/** WITA (Lombok's timezone) is a fixed UTC+8 offset with no daylight saving, so it's safe to
 * hard-code rather than resolve via Intl — same assumption admin-format.ts already makes. */
const MAKASSAR_OFFSET = '+08:00';

export interface MeetingSlot {
  startIso: string;
  endIso: string;
}

function makassarLocalDateParts(instant: Date): { year: number; month: number; day: number } {
  const shifted = new Date(instant.getTime() + 8 * 3600 * 1000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function makassarInstant(year: number, month: number, day: number, hour: number, minute: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0');
  return new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${MAKASSAR_OFFSET}`);
}

function overlapsBusy(start: Date, end: Date, busy: BusyPeriod[]): boolean {
  return busy.some((b) => start < new Date(b.end) && new Date(b.start) < end);
}

/** Pure function (no I/O) so it's easy to test/verify directly: walks the next
 * MEETING_WINDOW_DAYS calendar days (Lombok-local), skips weekends, generates
 * MEETING_DURATION_MINUTES slots across business hours, and drops anything that's either too soon
 * (inside MEETING_LEAD_HOURS from `now`) or overlaps a busy period from the connected calendar. */
export function computeAvailableSlots(busy: BusyPeriod[], now: Date = new Date()): MeetingSlot[] {
  const earliestBookable = new Date(now.getTime() + MEETING_LEAD_HOURS * 3600 * 1000);
  const slots: MeetingSlot[] = [];
  const start = makassarLocalDateParts(now);
  const startOfToday = makassarInstant(start.year, start.month, start.day, 0, 0);

  for (let dayOffset = 0; dayOffset < MEETING_WINDOW_DAYS; dayOffset++) {
    const dayInstant = new Date(startOfToday.getTime() + dayOffset * 24 * 3600 * 1000);
    const { year, month, day } = makassarLocalDateParts(dayInstant);
    const weekday = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00${MAKASSAR_OFFSET}`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue; // Sunday, Saturday

    for (let minutes = BUSINESS_START_HOUR * 60; minutes + MEETING_DURATION_MINUTES <= BUSINESS_END_HOUR * 60; minutes += MEETING_DURATION_MINUTES) {
      const slotStart = makassarInstant(year, month, day, Math.floor(minutes / 60), minutes % 60);
      const slotEnd = new Date(slotStart.getTime() + MEETING_DURATION_MINUTES * 60 * 1000);
      if (slotStart < earliestBookable) continue;
      if (overlapsBusy(slotStart, slotEnd, busy)) continue;
      slots.push({ startIso: slotStart.toISOString(), endIso: slotEnd.toISOString() });
    }
  }
  return slots;
}

export function generateMeetingToken(): string {
  return randomBytes(32).toString('hex');
}

export interface MeetingInviteSummaryRow {
  id: number;
  letter_of_offer_id: number | null;
  status: 'sent' | 'booked' | 'cancelled';
  parent_email: string;
  meeting_format: 'in_person' | 'video' | null;
  booked_start: string | null;
  booked_end: string | null;
  meet_link: string | null;
  booked_by_name: string | null;
}

export async function getMeetingInvitesForChild(childId: number): Promise<MeetingInviteSummaryRow[]> {
  return (await sql`
    SELECT id, letter_of_offer_id, status, parent_email, meeting_format,
      booked_start::text, booked_end::text, meet_link, booked_by_name
    FROM meeting_invites WHERE child_id = ${childId}
    ORDER BY created_at DESC
  `) as unknown as MeetingInviteSummaryRow[];
}

export async function createMeetingInvite(input: {
  childId: number;
  letterOfOfferId: number | null;
  parentEmail: string;
}): Promise<{ id: number; token: string }> {
  const token = generateMeetingToken();
  const rows = await sql`
    INSERT INTO meeting_invites (child_id, letter_of_offer_id, token, parent_email)
    VALUES (${input.childId}, ${input.letterOfOfferId}, ${token}, ${input.parentEmail})
    RETURNING id
  `;
  return { id: rows[0].id as number, token };
}

export interface MeetingInviteDetail {
  id: number;
  token: string;
  status: 'sent' | 'booked' | 'cancelled';
  child_id: number;
  letter_of_offer_id: number | null;
  parent_email: string;
  child_full_name: string;
  meeting_format: 'in_person' | 'video' | null;
  booked_start: string | null;
  booked_end: string | null;
  meet_link: string | null;
}

export async function getMeetingInviteByToken(token: string): Promise<MeetingInviteDetail | null> {
  const rows = (await sql`
    SELECT mi.id, mi.token, mi.status, mi.child_id, mi.letter_of_offer_id, mi.parent_email,
      mi.meeting_format, mi.booked_start::text, mi.booked_end::text, mi.meet_link,
      c.child_full_name
    FROM meeting_invites mi JOIN children c ON c.id = mi.child_id
    WHERE mi.token = ${token}
  `) as unknown as MeetingInviteDetail[];
  return rows[0] || null;
}

export async function markMeetingBooked(
  id: number,
  input: {
    startIso: string;
    endIso: string;
    format: 'in_person' | 'video';
    bookedByName: string;
    googleEventId: string;
    meetLink: string | null;
  }
): Promise<void> {
  await sql`
    UPDATE meeting_invites SET
      status = 'booked',
      meeting_format = ${input.format},
      booked_start = ${input.startIso}::timestamptz,
      booked_end = ${input.endIso}::timestamptz,
      booked_by_name = ${input.bookedByName},
      google_event_id = ${input.googleEventId},
      meet_link = ${input.meetLink},
      booked_at = now()
    WHERE id = ${id}
  `;
}
