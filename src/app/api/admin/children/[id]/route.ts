import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { updateChildSchema, firstIssueMessage } from '@/lib/validation';

/** Every field the general Child Card edit form can save — status and is_active are NOT among
 * them (updateChildSchema doesn't declare them, so they're dropped even if a client sends them).
 * Those two only ever change via PATCH /api/admin/children/[id]/status, which is the only thing
 * a board drag calls — see src/lib/child-lifecycle.ts for the guard rail that gates it. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can edit family records.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid update.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE children SET
        programme = COALESCE(${d.programme ?? null}, programme),
        class_band = COALESCE(${d.classBand ?? null}, class_band),
        class_name = COALESCE(${d.className ?? null}, class_name),
        child_full_name = COALESCE(${d.childFullName ?? null}, child_full_name),
        child_nickname = COALESCE(${d.childNickname ?? null}, child_nickname),
        dob = COALESCE(${d.dob ?? null}::date, dob),
        gender = COALESCE(${d.gender ?? null}, gender),
        nationality = COALESCE(${d.nationality ?? null}, nationality),
        enrolment_date = COALESCE(${d.enrolmentDate ?? null}::date, enrolment_date),
        exit_date = COALESCE(${d.exitDate ?? null}::date, exit_date),
        parent1_name = COALESCE(${d.parent1Name ?? null}, parent1_name),
        parent1_relationship = COALESCE(${d.parent1Relationship ?? null}, parent1_relationship),
        parent1_nationality = COALESCE(${d.parent1Nationality ?? null}, parent1_nationality),
        parent2_name = COALESCE(${d.parent2Name ?? null}, parent2_name),
        parent2_relationship = COALESCE(${d.parent2Relationship ?? null}, parent2_relationship),
        parent2_nationality = COALESCE(${d.parent2Nationality ?? null}, parent2_nationality),
        siblings_at_school = COALESCE(${d.siblingsAtSchool ?? null}, siblings_at_school),
        sibling_discount_tier = COALESCE(${d.siblingDiscountTier ?? null}, sibling_discount_tier),
        tuition_plan = COALESCE(${d.tuitionPlan ?? null}, tuition_plan),
        payment_status = COALESCE(${d.paymentStatus ?? null}, payment_status),
        emergency_contact_name = COALESCE(${d.emergencyContactName ?? null}, emergency_contact_name),
        emergency_contact_phone = COALESCE(${d.emergencyContactPhone ?? null}, emergency_contact_phone),
        allergies_medical_notes = COALESCE(${d.allergiesMedicalNotes ?? null}, allergies_medical_notes),
        dietary_requirements = COALESCE(${d.dietaryRequirements ?? null}, dietary_requirements),
        religion = COALESCE(${d.religion ?? null}, religion),
        home_language = COALESCE(${d.homeLanguage ?? null}, home_language),
        primary_contact_email = COALESCE(${d.primaryContactEmail ?? null}, primary_contact_email),
        primary_contact_phone = COALESCE(${d.primaryContactPhone ?? null}, primary_contact_phone),
        nisn_request_signed = COALESCE(${d.nisnRequestSigned ?? null}, nisn_request_signed),
        nisn_request_date = COALESCE(${d.nisnRequestDate ?? null}::date, nisn_request_date),
        nisn_number = COALESCE(${d.nisnNumber ?? null}, nisn_number),
        liability_form_signed = COALESCE(${d.liabilityFormSigned ?? null}, liability_form_signed),
        liability_form_date = COALESCE(${d.liabilityFormDate ?? null}::date, liability_form_date),
        photography_signed = COALESCE(${d.photographySigned ?? null}, photography_signed),
        photography_consent = COALESCE(${d.photographyConsent ?? null}, photography_consent),
        photography_form_date = COALESCE(${d.photographyFormDate ?? null}::date, photography_form_date),
        pickup_authorization_signed = COALESCE(${d.pickupAuthorizationSigned ?? null}, pickup_authorization_signed),
        authorized_pickup_persons = COALESCE(${d.authorizedPickupPersons ?? null}, authorized_pickup_persons),
        pickup_form_date = COALESCE(${d.pickupFormDate ?? null}::date, pickup_form_date),
        behavioral_form_signed = COALESCE(${d.behavioralFormSigned ?? null}, behavioral_form_signed),
        behavioral_form_date = COALESCE(${d.behavioralFormDate ?? null}::date, behavioral_form_date),
        financial_agreement_signed = COALESCE(${d.financialAgreementSigned ?? null}, financial_agreement_signed),
        financial_agreement_date = COALESCE(${d.financialAgreementDate ?? null}::date, financial_agreement_date),
        parent_protection_addendum_signed = COALESCE(${d.parentProtectionAddendumSigned ?? null}, parent_protection_addendum_signed),
        data_consent_signed = COALESCE(${d.dataConsentSigned ?? null}, data_consent_signed),
        passport_copy_url = COALESCE(${d.passportCopyUrl ?? null}, passport_copy_url),
        visa_status = COALESCE(${d.visaStatus ?? null}, visa_status),
        kitas_copy_url = COALESCE(${d.kitasCopyUrl ?? null}, kitas_copy_url),
        birth_certificate_url = COALESCE(${d.birthCertificateUrl ?? null}, birth_certificate_url),
        previous_school = COALESCE(${d.previousSchool ?? null}, previous_school),
        lunch_option = COALESCE(${d.lunchOption ?? null}, lunch_option),
        photo_url = COALESCE(${d.photoUrl ?? null}, photo_url),
        photo_updated_by_label = CASE WHEN ${d.photoUrl ?? null}::text IS NOT NULL THEN ${`Admin: ${staff.email}`} ELSE photo_updated_by_label END,
        photo_updated_at = CASE WHEN ${d.photoUrl ?? null}::text IS NOT NULL THEN now() ELSE photo_updated_at END,
        classroom_student_email = COALESCE(${d.classroomStudentEmail ?? null}, classroom_student_email),
        enrollment_type = COALESCE(${d.enrollmentType ?? null}, enrollment_type),
        updated_at = now()
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/children/:id] failed to update child', err);
    return NextResponse.json({ error: 'Could not save changes.' }, { status: 500 });
  }
}

/** Hard-deletes a child record — for a genuinely blank duplicate or a card created in error, never
 * for a real (even former) student: drag the card to Inactive on the Family Board for that instead,
 * which keeps their attendance/invoice/compliance history intact. Refuses to delete (409) if the
 * child has any record that represents real activity — a linked parent-portal account, a term
 * report, a work sample, a tagged photo, an invoice/line item, or a Google Classroom submission —
 * rather than silently discarding academic or financial history. Everything else that references
 * the child either already cascades at the schema level (compliance signatures, letters of offer,
 * the activity log, meeting invites, lunch orders, attendance) or is just a bookkeeping link
 * (admissions_enquiries.converted_child_id, class_forecast_entries.linked_child_id,
 * guardian_children), cleared explicitly below so the final DELETE never hits a FK violation. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete family records.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    const existing = await sql`SELECT id FROM children WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    const [{ real_record_count }] = (await sql`
      SELECT (
        (SELECT COUNT(*) FROM student_accounts WHERE child_id = ${id}) +
        (SELECT COUNT(*) FROM learning_profiles WHERE child_id = ${id}) +
        (SELECT COUNT(*) FROM work_samples WHERE child_id = ${id}) +
        (SELECT COUNT(*) FROM photo_feed_tags WHERE child_id = ${id}) +
        (SELECT COUNT(*) FROM invoice_children WHERE child_id = ${id}) +
        (SELECT COUNT(*) FROM invoice_line_items WHERE child_id = ${id}) +
        (SELECT COUNT(*) FROM classroom_submissions WHERE child_id = ${id})
      )::int AS real_record_count
    `) as unknown as { real_record_count: number }[];

    if (real_record_count > 0) {
      return NextResponse.json(
        {
          error:
            'This child has real records on file (a portal account, reports, work samples, photos, an invoice, or a Classroom submission) and can’t be deleted. Drag their card to Inactive on the Family Board instead.',
        },
        { status: 409 }
      );
    }

    await sql`UPDATE admissions_enquiries SET converted_child_id = NULL WHERE converted_child_id = ${id}`;
    await sql`UPDATE class_forecast_entries SET linked_child_id = NULL WHERE linked_child_id = ${id}`;
    await sql`DELETE FROM guardian_children WHERE child_id = ${id}`;
    await sql`DELETE FROM children WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/children/:id] failed to delete child', err);
    return NextResponse.json({ error: 'Could not delete child.' }, { status: 500 });
  }
}
