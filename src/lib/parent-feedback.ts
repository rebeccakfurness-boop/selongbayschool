import { sql } from '@/lib/db';
import type { CreateParentFeedbackInput, UpdateParentFeedbackInput } from '@/lib/validation';

export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = {
  child_safety_safeguarding: 'Child Safety & Safeguarding',
  bullying_behavioral: 'Bullying / Behavioral Concern',
  health_medical: 'Health & Medical',
  facilities_environment: 'Facilities & Environment',
  staff_conduct: 'Staff Conduct',
  academic_teaching: 'Academic / Teaching',
  communication_admin: 'Communication / Admin',
  other: 'Other',
};

export type FeedbackStatus = 'new' | 'in_review' | 'resolved';

export interface ParentFeedbackRow {
  id: number;
  category: string;
  description: string;
  desired_outcome: string | null;
  urgent: boolean;
  status: FeedbackStatus;
  child_full_name: string | null;
  created_at: string;
}

export async function getFeedbackForCustomer(customerId: number): Promise<ParentFeedbackRow[]> {
  return (await sql`
    SELECT f.id, f.category, f.description, f.desired_outcome, f.urgent, f.status,
      c.child_full_name, f.created_at::text
    FROM parent_feedback f
    LEFT JOIN children c ON c.id = f.child_id
    WHERE f.customer_id = ${customerId}
    ORDER BY f.created_at DESC
  `) as unknown as ParentFeedbackRow[];
}

export async function createParentFeedback(
  customerId: number,
  input: CreateParentFeedbackInput
): Promise<{ id: number; created_at: string }> {
  const [row] = (await sql`
    INSERT INTO parent_feedback (customer_id, child_id, category, description, desired_outcome, urgent)
    VALUES (${customerId}, ${input.childId ?? null}, ${input.category}, ${input.description}, ${input.desiredOutcome ?? null}, ${input.urgent ?? false})
    RETURNING id, created_at::text
  `) as unknown as { id: number; created_at: string }[];
  return row;
}

export async function markFeedbackNotifyStatus(id: number, status: 'sent' | 'failed'): Promise<void> {
  await sql`UPDATE parent_feedback SET notify_email_status = ${status} WHERE id = ${id}`;
}

export interface AdminParentFeedbackRow {
  id: number;
  category: string;
  description: string;
  desired_outcome: string | null;
  urgent: boolean;
  status: FeedbackStatus;
  admin_notes: string | null;
  is_read: boolean;
  notify_email_status: string;
  parent_name: string | null;
  parent_email: string;
  child_full_name: string | null;
  created_at: string;
}

export async function getAllFeedback(): Promise<AdminParentFeedbackRow[]> {
  return (await sql`
    SELECT f.id, f.category, f.description, f.desired_outcome, f.urgent, f.status, f.admin_notes,
      f.is_read, f.notify_email_status, cu.name AS parent_name, cu.email AS parent_email,
      ch.child_full_name, f.created_at::text
    FROM parent_feedback f
    JOIN customers cu ON cu.id = f.customer_id
    LEFT JOIN children ch ON ch.id = f.child_id
    ORDER BY f.urgent DESC, f.is_read ASC, f.created_at DESC
    LIMIT 300
  `) as unknown as AdminParentFeedbackRow[];
}

export async function updateFeedback(id: number, input: UpdateParentFeedbackInput): Promise<void> {
  if (input.status !== undefined) {
    await sql`
      UPDATE parent_feedback SET status = ${input.status}, resolved_at = ${input.status === 'resolved' ? new Date().toISOString() : null}
      WHERE id = ${id}
    `;
  }
  if (input.adminNotes !== undefined) {
    await sql`UPDATE parent_feedback SET admin_notes = ${input.adminNotes} WHERE id = ${id}`;
  }
  if (input.isRead !== undefined) {
    await sql`UPDATE parent_feedback SET is_read = ${input.isRead} WHERE id = ${id}`;
  }
}
