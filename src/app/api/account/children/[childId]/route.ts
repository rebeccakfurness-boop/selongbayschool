import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { updateOwnChildSchema } from '@/lib/validation';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getTeacherEmailsForClass } from '@/lib/current-staff';
import { sendChildProfileEditNotification, type ChildProfileFieldChange } from '@/lib/email';

/** POST (not PATCH) to match every other /api/account/* route in this app — they all use
 * useFormSubmit, which is hardcoded to POST. Field whitelist is enforced by updateOwnChildSchema
 * itself (unrecognized keys, e.g. status/className/tuitionPlan, are silently dropped by zod, not
 * validated), not by anything in this handler — see the schema's own comment for why. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to update your child’s profile.' }, { status: 401 });
  }

  const { childId: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateOwnChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    const before = await sql`
      SELECT child_full_name, class_name, allergies_medical_notes, dietary_requirements, lunch_option
      FROM children WHERE id = ${childId}
    `;
    const child = before[0];
    if (!child) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    await sql`
      UPDATE children SET
        primary_contact_email = COALESCE(${d.primaryContactEmail ?? null}, primary_contact_email),
        primary_contact_phone = COALESCE(${d.primaryContactPhone ?? null}, primary_contact_phone),
        emergency_contact_name = COALESCE(${d.emergencyContactName ?? null}, emergency_contact_name),
        emergency_contact_phone = COALESCE(${d.emergencyContactPhone ?? null}, emergency_contact_phone),
        allergies_medical_notes = COALESCE(${d.allergiesMedicalNotes ?? null}, allergies_medical_notes),
        dietary_requirements = COALESCE(${d.dietaryRequirements ?? null}, dietary_requirements),
        lunch_option = COALESCE(${d.lunchOption ?? null}, lunch_option),
        home_language = COALESCE(${d.homeLanguage ?? null}, home_language),
        previous_school = COALESCE(${d.previousSchool ?? null}, previous_school),
        photo_url = COALESCE(${d.photoUrl ?? null}, photo_url),
        photo_updated_by_label = CASE WHEN ${d.photoUrl ?? null} IS NOT NULL THEN ${`Parent: ${session.email}`} ELSE photo_updated_by_label END,
        photo_updated_at = CASE WHEN ${d.photoUrl ?? null} IS NOT NULL THEN now() ELSE photo_updated_at END,
        passport_copy_url = COALESCE(${d.passportCopyUrl ?? null}, passport_copy_url),
        kitas_copy_url = COALESCE(${d.kitasCopyUrl ?? null}, kitas_copy_url),
        birth_certificate_url = COALESCE(${d.birthCertificateUrl ?? null}, birth_certificate_url),
        updated_at = now()
      WHERE id = ${childId}
    `;

    const changes: ChildProfileFieldChange[] = [];
    if (d.allergiesMedicalNotes !== undefined && d.allergiesMedicalNotes !== child.allergies_medical_notes) {
      changes.push({ label: 'Allergies & Medical Notes', oldValue: child.allergies_medical_notes as string | null, newValue: d.allergiesMedicalNotes ?? null });
    }
    if (d.dietaryRequirements !== undefined && d.dietaryRequirements !== child.dietary_requirements) {
      changes.push({ label: 'Dietary Requirements', oldValue: child.dietary_requirements as string | null, newValue: d.dietaryRequirements ?? null });
    }
    if (d.lunchOption !== undefined && d.lunchOption !== child.lunch_option) {
      changes.push({ label: 'Lunch Choice', oldValue: child.lunch_option as string | null, newValue: d.lunchOption ?? null });
    }

    if (changes.length > 0) {
      const teacherEmails = await getTeacherEmailsForClass(child.class_name as string | null);
      await sendChildProfileEditNotification({
        childFullName: child.child_full_name as string,
        editedByLabel: `Parent (${session.email})`,
        changes,
        teacherEmails,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/children/:childId] failed to update child', err);
    return NextResponse.json({ error: 'Could not save your changes right now. Please try again shortly.' }, { status: 500 });
  }
}
