import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import {
  getSessionOptions,
  getCustomerSessionOptions,
  getStudentSessionOptions,
  type AdminSessionData,
  type CustomerSessionData,
  type StudentSessionData,
} from '@/lib/auth';
import { canAccessClass } from '@/lib/current-staff';
import { LearningProfileDocument, type LearningProfileData, type LearningProfileSubjectData } from '@/lib/pdf/LearningProfileDocument';

/** Not gated by src/proxy.ts (that middleware only covers /admin, /account, /student paths) —
 * three different session types can legitimately reach this PDF (admin/teacher, the child's
 * guardian, or the child themselves), so authorization is checked here directly instead. */
async function isAuthorized(childId: number, className: string | null): Promise<boolean> {
  const jar = await cookies();

  const adminSession = await getIronSession<AdminSessionData>(jar, await getSessionOptions());
  if (adminSession.adminUserId) {
    if (adminSession.role === 'admin') return true;
    return canAccessClass({ adminUserId: adminSession.adminUserId, email: adminSession.email!, role: 'teacher' }, className);
  }

  const customerSession = await getIronSession<CustomerSessionData>(jar, await getCustomerSessionOptions());
  if (customerSession.customerId) {
    const rows = await sql`
      SELECT 1 FROM guardian_children WHERE customer_id = ${customerSession.customerId} AND child_id = ${childId}
    `;
    if (rows.length > 0) return true;
  }

  const studentSession = await getIronSession<StudentSessionData>(jar, await getStudentSessionOptions());
  if (studentSession.studentAccountId && studentSession.childId === childId) return true;

  return false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid report id.' }, { status: 400 });
  }

  await ensureSchema();

  const profiles = (await sql`SELECT * FROM learning_profiles WHERE id = ${id}`) as unknown as (LearningProfileData & {
    child_id: number;
  })[];
  const profile = profiles[0];
  if (!profile) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  const children = await sql`SELECT child_full_name, class_name FROM children WHERE id = ${profile.child_id}`;
  const child = children[0];
  if (!child) {
    return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
  }

  if (!(await isAuthorized(profile.child_id, child.class_name as string | null))) {
    return NextResponse.json({ error: 'Not authorized to view this report.' }, { status: 403 });
  }

  const subjects = (await sql`
    SELECT subject_area, sub_subject, achievement, effort, teacher_comment
    FROM learning_profile_subjects
    WHERE learning_profile_id = ${id}
    ORDER BY sort_order
  `) as unknown as LearningProfileSubjectData[];

  try {
    const buffer = await renderToBuffer(
      LearningProfileDocument({ childFullName: child.child_full_name as string, profile, subjects })
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${(child.child_full_name as string).replace(/[^a-z0-9]+/gi, '-')}-${profile.term_label.replace(/[^a-z0-9]+/gi, '-')}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[api/learning-profiles/:id/pdf] failed to render', err);
    // Admin-only internal route, so it's fine to return the real error rather than a generic
    // message — this is what actually let the missing-asset PDF bug get diagnosed and fixed.
    return NextResponse.json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
