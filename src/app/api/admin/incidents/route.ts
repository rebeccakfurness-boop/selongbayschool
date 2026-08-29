import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { createIncidentReportSchema } from '@/lib/validation';
import {
  createIncidentReport,
  markIncidentNotifyStatus,
  INCIDENT_TYPE_LABELS,
  INJURY_SEVERITY_LABELS,
} from '@/lib/incident-reports';
import { sendIncidentReportNotification } from '@/lib/email';

/** Any staff member (admin or teacher) can file one -- this is the reporting form itself, not the
 * oversight view (see /api/admin/incidents/[id] for the admin-only status/notes update). */
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createIncidentReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid report.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const childFullName = d.childId
      ? ((await sql`SELECT child_full_name FROM children WHERE id = ${d.childId}`) as unknown as { child_full_name: string }[])[0]
          ?.child_full_name ?? null
      : null;
    const [reporter] = (await sql`SELECT display_name FROM admin_users WHERE id = ${staff.adminUserId}`) as unknown as {
      display_name: string | null;
    }[];

    const { id } = await createIncidentReport(staff.adminUserId, d);

    const flagged =
      d.incidentType === 'child_incident' ||
      (d.incidentType === 'first_aid_injury' && (d.injurySeverity === 'moderate' || d.injurySeverity === 'severe'));

    const sent = await sendIncidentReportNotification({
      reporterName: reporter?.display_name || staff.email,
      incidentTypeLabel: INCIDENT_TYPE_LABELS[d.incidentType] ?? d.incidentType,
      childFullName,
      className: d.className ?? null,
      location: d.location ?? null,
      occurredAt: d.occurredAt,
      description: d.description,
      actionTaken: d.actionTaken ?? null,
      injurySeverityLabel: d.injurySeverity ? INJURY_SEVERITY_LABELS[d.injurySeverity] ?? d.injurySeverity : null,
      followUpRequired: d.followUpRequired ?? false,
      parentNotified: d.parentNotified ?? false,
      flagged,
    });
    await markIncidentNotifyStatus(id, sent ? 'sent' : 'failed');

    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/incidents] failed to submit', err);
    return NextResponse.json({ error: 'Could not submit this report. Please try again.' }, { status: 500 });
  }
}
