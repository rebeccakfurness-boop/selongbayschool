import type { ChildStatus } from '@/lib/family-data';

/** Pure helpers with no DB access, split out from child-lifecycle.ts specifically so
 * FamilyBoard.tsx (a client component) can import them without pulling '@neondatabase/serverless'
 * into the browser bundle. child-lifecycle.ts re-exports everything here too, so server code can
 * import from either file. */

export const ACTIVE_STATUSES: ChildStatus[] = ['full_time', 'temporary', 'worldschooler', 'hybrid'];

export function isActiveStatus(status: ChildStatus): boolean {
  return (ACTIVE_STATUSES as string[]).includes(status);
}

/** Compliance forms are considered stale a year after signing (this project's compliance forms
 * are annual consent forms, e.g. photography/liability for the current school year) — a specific,
 * reasonable default, not something asked for explicitly; easy to change in one place if the
 * school's actual re-signing cadence differs. Plain day-count (not a SQL INTERVAL literal) so the
 * board/card queries can just do `date_col < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}`. */
export const COMPLIANCE_STALE_AFTER_DAYS = 365;

export type ComplianceBadge = 'unsigned' | 'signed' | 'out_of_date';

export function complianceBadge(signedCount: number, totalCount: number, outOfDate: boolean): ComplianceBadge {
  if (signedCount < totalCount) return 'unsigned';
  return outOfDate ? 'out_of_date' : 'signed';
}

export type InvoiceBadge = 'not_generated' | 'outstanding' | 'paid' | { overdueDays: number };

/** Derives the card's invoice badge from the single latest non-cancelled tuition invoice (fetched
 * via a LEFT JOIN LATERAL in the board/card queries — see families/page.tsx) rather than a new
 * per-child query; returns null for a child not yet in an active status, since "no invoice" is
 * expected and not worth a badge before there's anything to invoice. */
export function invoiceBadge(status: ChildStatus, latestInvoice: { status: string; days_overdue: number } | null): InvoiceBadge | null {
  if (!isActiveStatus(status)) return null;
  if (!latestInvoice) return 'not_generated';
  if (latestInvoice.status === 'paid') return 'paid';
  if (latestInvoice.days_overdue > 0) return { overdueDays: latestInvoice.days_overdue };
  return 'outstanding';
}
