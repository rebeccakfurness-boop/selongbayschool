import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateStaffHrSchema, firstIssueMessage } from '@/lib/validation';

/** The Staff Card's general edit-form save -- admin-only, since this covers BPJS/bank/contact/
 * document fields. Mirrors PATCH /api/admin/children/[id] (COALESCE per field, employment_status
 * and is_active excluded -- see updateStaffHrSchema's own comment for why those are separate
 * routes). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = updateStaffHrSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid update.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE admin_users SET
        display_name = COALESCE(${d.displayName ?? null}, display_name),
        position_title = COALESCE(${d.positionTitle ?? null}, position_title),
        dob = COALESCE(${d.dob ?? null}::date, dob),
        start_date = COALESCE(${d.startDate ?? null}::date, start_date),
        end_date = COALESCE(${d.endDate ?? null}::date, end_date),
        phone = COALESCE(${d.phone ?? null}, phone),
        address = COALESCE(${d.address ?? null}, address),
        nationality = COALESCE(${d.nationality ?? null}, nationality),
        emergency_contact_name = COALESCE(${d.emergencyContactName ?? null}, emergency_contact_name),
        emergency_contact_phone = COALESCE(${d.emergencyContactPhone ?? null}, emergency_contact_phone),
        cv_url = COALESCE(${d.cvUrl ?? null}, cv_url),
        contract_url = COALESCE(${d.contractUrl ?? null}, contract_url),
        qualifications = COALESCE(${d.qualifications ?? null}, qualifications),
        visa_status = COALESCE(${d.visaStatus ?? null}, visa_status),
        kitas_number = COALESCE(${d.kitasNumber ?? null}, kitas_number),
        kitas_expiry = COALESCE(${d.kitasExpiry ?? null}::date, kitas_expiry),
        passport_copy_url = COALESCE(${d.passportCopyUrl ?? null}, passport_copy_url),
        bpjs_kesehatan_number = COALESCE(${d.bpjsKesehatanNumber ?? null}, bpjs_kesehatan_number),
        bpjs_kesehatan_status = COALESCE(${d.bpjsKesehatanStatus ?? null}, bpjs_kesehatan_status),
        bpjs_ketenagakerjaan_number = COALESCE(${d.bpjsKetenagakerjaanNumber ?? null}, bpjs_ketenagakerjaan_number),
        bpjs_ketenagakerjaan_status = COALESCE(${d.bpjsKetenagakerjaanStatus ?? null}, bpjs_ketenagakerjaan_status),
        bank_name = COALESCE(${d.bankName ?? null}, bank_name),
        bank_account_number = COALESCE(${d.bankAccountNumber ?? null}, bank_account_number),
        bank_account_name = COALESCE(${d.bankAccountName ?? null}, bank_account_name),
        hr_notes = COALESCE(${d.hrNotes ?? null}, hr_notes)
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/hr] failed to update', err);
    return NextResponse.json({ error: 'Could not save changes.' }, { status: 500 });
  }
}
