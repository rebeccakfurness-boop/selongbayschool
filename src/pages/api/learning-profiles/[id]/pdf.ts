import type { NextApiRequest, NextApiResponse } from 'next';
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

/** Lives under the Pages Router — see /api/invoices/:id/pdf.ts for why (App Router route handlers
 * trigger a "Minified React error #31" inside @react-pdf/renderer's bundled reconciler; Pages
 * Router API routes don't).
 *
 * Not gated by src/proxy.ts (that middleware only covers /admin, /account, /student paths) —
 * three different session types can legitimately reach this PDF (admin/teacher, the child's
 * guardian, or the child themselves), so authorization is checked here directly instead. */
async function isAuthorized(req: NextApiRequest, res: NextApiResponse, childId: number, className: string | null): Promise<boolean> {
  const adminSession = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());
  if (adminSession.adminUserId) {
    if (adminSession.role === 'admin') return true;
    return canAccessClass({ adminUserId: adminSession.adminUserId, email: adminSession.email!, role: 'teacher' }, className);
  }

  const customerSession = await getIronSession<CustomerSessionData>(req, res, await getCustomerSessionOptions());
  if (customerSession.customerId) {
    const rows = await sql`
      SELECT 1 FROM guardian_children WHERE customer_id = ${customerSession.customerId} AND child_id = ${childId}
    `;
    if (rows.length > 0) return true;
  }

  const studentSession = await getIronSession<StudentSessionData>(req, res, await getStudentSessionOptions());
  if (studentSession.studentAccountId && studentSession.childId === childId) return true;

  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid report id.' });
    return;
  }

  await ensureSchema();

  const profiles = (await sql`SELECT * FROM learning_profiles WHERE id = ${id}`) as unknown as (LearningProfileData & {
    child_id: number;
  })[];
  const profile = profiles[0];
  if (!profile) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  const children = await sql`SELECT child_full_name, class_name FROM children WHERE id = ${profile.child_id}`;
  const child = children[0];
  if (!child) {
    res.status(404).json({ error: 'Child not found.' });
    return;
  }

  if (!(await isAuthorized(req, res, profile.child_id, child.class_name as string | null))) {
    res.status(403).json({ error: 'Not authorized to view this report.' });
    return;
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
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${(child.child_full_name as string).replace(/[^a-z0-9]+/gi, '-')}-${profile.term_label.replace(/[^a-z0-9]+/gi, '-')}.pdf"`
    );
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[api/learning-profiles/:id/pdf] failed to render', err);
    // Admin-only internal route, so it's fine to return the real error rather than a generic
    // message — this is what actually let the missing-asset PDF bug get diagnosed and fixed.
    res.status(500).json({ error: `Could not generate PDF: ${err instanceof Error ? err.message : String(err)}` });
  }
}
