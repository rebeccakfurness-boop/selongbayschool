import { sql } from '@/lib/db';
import type {
  CreateResourceRequestInput,
  AttachResourceRequestReceiptInput,
  DecideResourceRequestInput,
} from '@/lib/validation';

export type ResourceRequestStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export const RESOURCE_REQUEST_STATUS_LABELS: Record<ResourceRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved — awaiting reimbursement',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed',
};

export interface ResourceRequestRow {
  id: number;
  item_description: string;
  reason: string | null;
  amount_idr: number | null;
  receipt_url: string | null;
  status: ResourceRequestStatus;
  admin_notes: string | null;
  decided_at: string | null;
  reimbursed_at: string | null;
  created_at: string;
}

export async function getResourceRequestsForStaff(adminUserId: number): Promise<ResourceRequestRow[]> {
  return (await sql`
    SELECT id, item_description, reason, amount_idr, receipt_url, status, admin_notes,
      decided_at::text, reimbursed_at::text, created_at::text
    FROM resource_requests
    WHERE requested_by = ${adminUserId}
    ORDER BY created_at DESC
  `) as unknown as ResourceRequestRow[];
}

export interface AdminResourceRequestRow extends ResourceRequestRow {
  requested_by: number;
  requester_name: string | null;
  requester_email: string;
  decided_by_name: string | null;
  reimbursed_by_name: string | null;
}

/** Pending requests first (they need a decision), then approved-and-awaiting-reimbursement, then
 * everything else (rejected/reimbursed) most-recent-first -- so the office sees what needs action
 * before the settled history. */
export async function getAllResourceRequests(): Promise<AdminResourceRequestRow[]> {
  return (await sql`
    SELECT r.id, r.requested_by, r.item_description, r.reason, r.amount_idr, r.receipt_url,
      r.status, r.admin_notes, r.decided_at::text, r.reimbursed_at::text, r.created_at::text,
      COALESCE(req.display_name, req.email) AS requester_name, req.email AS requester_email,
      COALESCE(dec.display_name, dec.email) AS decided_by_name,
      COALESCE(reim.display_name, reim.email) AS reimbursed_by_name
    FROM resource_requests r
    JOIN admin_users req ON req.id = r.requested_by
    LEFT JOIN admin_users dec ON dec.id = r.decided_by
    LEFT JOIN admin_users reim ON reim.id = r.reimbursed_by
    ORDER BY
      CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      r.created_at DESC
    LIMIT 300
  `) as unknown as AdminResourceRequestRow[];
}

export async function createResourceRequest(
  requestedBy: number,
  input: CreateResourceRequestInput
): Promise<{ id: number; created_at: string }> {
  const [row] = (await sql`
    INSERT INTO resource_requests (requested_by, item_description, reason, amount_idr, receipt_url)
    VALUES (${requestedBy}, ${input.itemDescription}, ${input.reason ?? null}, ${input.amountIdr ?? null}, ${input.receiptUrl ?? null})
    RETURNING id, created_at::text
  `) as unknown as { id: number; created_at: string }[];
  return row;
}

export async function attachResourceRequestReceipt(id: number, input: AttachResourceRequestReceiptInput): Promise<void> {
  await sql`
    UPDATE resource_requests
    SET receipt_url = ${input.receiptUrl}, amount_idr = COALESCE(${input.amountIdr ?? null}, amount_idr)
    WHERE id = ${id}
  `;
}

export async function decideResourceRequest(id: number, decidedBy: number, input: DecideResourceRequestInput): Promise<void> {
  if (input.status !== undefined) {
    await sql`UPDATE resource_requests SET status = ${input.status}, decided_by = ${decidedBy}, decided_at = now() WHERE id = ${id}`;
  }
  if (input.adminNotes !== undefined) {
    await sql`UPDATE resource_requests SET admin_notes = ${input.adminNotes} WHERE id = ${id}`;
  }
}

export async function markResourceRequestReimbursed(id: number, reimbursedBy: number): Promise<void> {
  await sql`
    UPDATE resource_requests
    SET status = 'reimbursed', reimbursed_by = ${reimbursedBy}, reimbursed_at = now()
    WHERE id = ${id}
  `;
}

export interface ExistingResourceRequest {
  requested_by: number;
  status: ResourceRequestStatus;
  receipt_url: string | null;
}

export async function getResourceRequestForGuard(id: number): Promise<ExistingResourceRequest | null> {
  const rows = (await sql`
    SELECT requested_by, status, receipt_url FROM resource_requests WHERE id = ${id}
  `) as unknown as ExistingResourceRequest[];
  return rows[0] ?? null;
}

export async function deleteResourceRequest(id: number): Promise<void> {
  await sql`DELETE FROM resource_requests WHERE id = ${id}`;
}
