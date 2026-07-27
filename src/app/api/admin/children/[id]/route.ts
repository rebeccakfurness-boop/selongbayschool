import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { updateChildSchema } from '@/lib/validation';

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
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE children SET
        status = COALESCE(${d.status ?? null}, status),
        is_active = COALESCE(${d.isActive ?? null}, is_active),
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
        classroom_student_email = COALESCE(${d.classroomStudentEmail ?? null}, classroom_student_email),
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
