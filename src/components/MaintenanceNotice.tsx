import { siteConfig } from '@/lib/site-content';

/**
 * One-line switch to remove this notice everywhere it's placed once it's no longer needed.
 * Currently shown at the top of: the Activities page, the parent login page (/account/login),
 * any page with the contact/admissions/high-school enquiry form (Contact, the 3 Admissions
 * subpages, and the High School banner on the Home page), and in the booking flow on every
 * activity card, just above the Book Now button.
 */
export const MAINTENANCE_NOTICE_ENABLED = true;

export const MAINTENANCE_NOTICE_TEXT =
  'Our booking and enquiry system is currently being updated for the new school year. To make a ' +
  'booking or enquiry in the meantime, please email hello@selongbayschool.com or message us at ' +
  '+62 813-5974-095.';

function NoticeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function NoticeMessage({ className }: { className?: string }) {
  const { email, phone, phoneHref } = siteConfig.contact;
  const emailIdx = MAINTENANCE_NOTICE_TEXT.indexOf(email);
  const phoneIdx = MAINTENANCE_NOTICE_TEXT.indexOf(phone);

  // Falls back to plain, unlinked text if MAINTENANCE_NOTICE_TEXT is ever edited to no longer
  // contain these exact substrings, rather than crashing the page.
  if (emailIdx === -1 || phoneIdx === -1) {
    return <p className={className}>{MAINTENANCE_NOTICE_TEXT}</p>;
  }

  return (
    <p className={className}>
      {MAINTENANCE_NOTICE_TEXT.slice(0, emailIdx)}
      <a href={`mailto:${email}`} className="font-bold underline underline-offset-2 hover:text-amber-950">
        {email}
      </a>
      {MAINTENANCE_NOTICE_TEXT.slice(emailIdx + email.length, phoneIdx)}
      <a href={phoneHref} className="font-bold underline underline-offset-2 hover:text-amber-950">
        {phone}
      </a>
      {MAINTENANCE_NOTICE_TEXT.slice(phoneIdx + phone.length)}
    </p>
  );
}

/** Compact, boxed version for tighter spots like an individual activity card or an embedded form. */
export function MaintenanceNoticeCompact() {
  if (!MAINTENANCE_NOTICE_ENABLED) return null;

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 px-3.5 py-3">
      <NoticeIcon className="mt-0.5 flex-shrink-0 text-amber-600" />
      <NoticeMessage className="text-[13px] leading-snug text-amber-900" />
    </div>
  );
}

/** Full-width banner for the top of a page. */
export default function MaintenanceNotice() {
  if (!MAINTENANCE_NOTICE_ENABLED) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-6 py-4 md:px-8">
        <NoticeIcon className="mt-0.5 flex-shrink-0 text-amber-600" />
        <NoticeMessage className="text-[14.5px] leading-relaxed text-amber-900" />
      </div>
    </div>
  );
}
