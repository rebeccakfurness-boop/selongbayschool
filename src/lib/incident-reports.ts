import { sql } from '@/lib/db';
import type { CreateIncidentReportInput, UpdateIncidentReportInput } from '@/lib/validation';

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  hazard: 'Hazard',
  child_incident: 'Child-Related Incident',
  first_aid_injury: 'First Aid / Injury',
  near_miss: 'Near Miss',
};

export const INJURY_SEVERITY_LABELS: Record<string, string> = {
  none: 'None',
  minor: 'Minor',
  moderate: 'Moderate',
  severe: 'Severe',
};

export type IncidentStatus = 'open' | 'in_review' | 'closed';

export interface IncidentReportRow {
  id: number;
  incident_type: string;
  child_full_name: string | null;
  class_name: string | null;
  location: string | null;
  occurred_at: string;
  description: string;
  action_taken: string | null;
  witnesses: string | null;
  injury_severity: string | null;
  follow_up_required: boolean;
  parent_notified: boolean;
  status: IncidentStatus;
  created_at: string;
}

export async function getIncidentReportsForStaff(adminUserId: number): Promise<IncidentReportRow[]> {
  return (await sql`
    SELECT r.id, r.incident_type, c.child_full_name, r.class_name, r.location, r.occurred_at::text,
      r.description, r.action_taken, r.witnesses, r.injury_severity, r.follow_up_required,
      r.parent_notified, r.status, r.created_at::text
    FROM incident_reports r
    LEFT JOIN children c ON c.id = r.child_id
    WHERE r.reported_by = ${adminUserId}
    ORDER BY r.occurred_at DESC
  `) as unknown as IncidentReportRow[];
}

export async function createIncidentReport(
  reportedBy: number,
  input: CreateIncidentReportInput
): Promise<{ id: number; created_at: string }> {
  const [row] = (await sql`
    INSERT INTO incident_reports (
      reported_by, incident_type, child_id, class_name, location, occurred_at, description,
      action_taken, witnesses, injury_severity, follow_up_required, parent_notified
    )
    VALUES (
      ${reportedBy}, ${input.incidentType}, ${input.childId ?? null}, ${input.className ?? null},
      ${input.location ?? null}, ${input.occurredAt}::timestamptz, ${input.description},
      ${input.actionTaken ?? null}, ${input.witnesses ?? null}, ${input.injurySeverity ?? null},
      ${input.followUpRequired ?? false}, ${input.parentNotified ?? false}
    )
    RETURNING id, created_at::text
  `) as unknown as { id: number; created_at: string }[];
  return row;
}

export async function markIncidentNotifyStatus(id: number, status: 'sent' | 'failed'): Promise<void> {
  await sql`UPDATE incident_reports SET notify_email_status = ${status} WHERE id = ${id}`;
}

export interface AdminIncidentReportRow extends IncidentReportRow {
  admin_notes: string | null;
  is_read: boolean;
  notify_email_status: string;
  reporter_name: string | null;
  reporter_email: string;
}

export async function getAllIncidentReports(): Promise<AdminIncidentReportRow[]> {
  return (await sql`
    SELECT r.id, r.incident_type, c.child_full_name, r.class_name, r.location, r.occurred_at::text,
      r.description, r.action_taken, r.witnesses, r.injury_severity, r.follow_up_required,
      r.parent_notified, r.status, r.admin_notes, r.is_read, r.notify_email_status,
      COALESCE(a.display_name, a.email) AS reporter_name, a.email AS reporter_email, r.created_at::text
    FROM incident_reports r
    JOIN admin_users a ON a.id = r.reported_by
    LEFT JOIN children c ON c.id = r.child_id
    ORDER BY r.status = 'closed', r.is_read ASC, r.occurred_at DESC
    LIMIT 300
  `) as unknown as AdminIncidentReportRow[];
}

export async function updateIncidentReport(id: number, input: UpdateIncidentReportInput): Promise<void> {
  if (input.status !== undefined) {
    await sql`UPDATE incident_reports SET status = ${input.status} WHERE id = ${id}`;
  }
  if (input.adminNotes !== undefined) {
    await sql`UPDATE incident_reports SET admin_notes = ${input.adminNotes} WHERE id = ${id}`;
  }
  if (input.isRead !== undefined) {
    await sql`UPDATE incident_reports SET is_read = ${input.isRead} WHERE id = ${id}`;
  }
}
