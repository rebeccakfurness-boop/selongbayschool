import { sql } from '@/lib/db';
import { COMPLIANCE_FORM_CONTENT, type ComplianceFormKey } from '@/lib/compliance-forms';

export function isComplianceFormKey(key: string): key is ComplianceFormKey {
  return key in COMPLIANCE_FORM_CONTENT;
}

export interface ComplianceSignatureRow {
  signed_by_name: string;
  signature_data_url: string;
  signed_at: string;
}

export async function getComplianceSignature(childId: number, formKey: ComplianceFormKey): Promise<ComplianceSignatureRow | null> {
  const rows = (await sql`
    SELECT signed_by_name, signature_data_url, signed_at::text
    FROM compliance_signatures WHERE child_id = ${childId} AND form_key = ${formKey}
  `) as unknown as ComplianceSignatureRow[];
  return rows[0] ?? null;
}

/** children.{form}_signed / {form}_date can't be updated via a dynamic column name in a
 * parameterized query, so this is an explicit switch over the 7 known keys rather than a
 * generic helper — same reasoning as the rest of the app's SQL (no raw/unsafe identifiers). */
async function setSignedFlag(childId: number, formKey: ComplianceFormKey, signed: boolean, dateStr: string | null) {
  switch (formKey) {
    case 'liability_form_signed':
      await sql`UPDATE children SET liability_form_signed = ${signed}, liability_form_date = ${dateStr}::date WHERE id = ${childId}`;
      return;
    case 'photography_signed':
      await sql`UPDATE children SET photography_signed = ${signed}, photography_form_date = ${dateStr}::date WHERE id = ${childId}`;
      return;
    case 'pickup_authorization_signed':
      await sql`UPDATE children SET pickup_authorization_signed = ${signed}, pickup_form_date = ${dateStr}::date WHERE id = ${childId}`;
      return;
    case 'behavioral_form_signed':
      await sql`UPDATE children SET behavioral_form_signed = ${signed}, behavioral_form_date = ${dateStr}::date WHERE id = ${childId}`;
      return;
    case 'financial_agreement_signed':
      await sql`UPDATE children SET financial_agreement_signed = ${signed}, financial_agreement_date = ${dateStr}::date WHERE id = ${childId}`;
      return;
    case 'parent_protection_addendum_signed':
      await sql`UPDATE children SET parent_protection_addendum_signed = ${signed} WHERE id = ${childId}`;
      return;
    case 'data_consent_signed':
      await sql`UPDATE children SET data_consent_signed = ${signed} WHERE id = ${childId}`;
      return;
  }
}

/** Signing again overwrites the previous signature (ON CONFLICT), since these are point-in-time
 * consent forms rather than documents with a signing history. Also flips the existing
 * children.{form}_signed / {form}_date columns so the rest of the Child Card (and the Overview
 * dashboard's "Forms Outstanding" tile) keeps working unchanged. */
export async function upsertComplianceSignature(
  childId: number,
  formKey: ComplianceFormKey,
  signedByName: string,
  signatureDataUrl: string
): Promise<ComplianceSignatureRow> {
  const [row] = (await sql`
    INSERT INTO compliance_signatures (child_id, form_key, signed_by_name, signature_data_url, signed_at)
    VALUES (${childId}, ${formKey}, ${signedByName}, ${signatureDataUrl}, now())
    ON CONFLICT (child_id, form_key) DO UPDATE SET
      signed_by_name = EXCLUDED.signed_by_name,
      signature_data_url = EXCLUDED.signature_data_url,
      signed_at = EXCLUDED.signed_at
    RETURNING signed_by_name, signature_data_url, signed_at::text
  `) as unknown as ComplianceSignatureRow[];
  await setSignedFlag(childId, formKey, true, row.signed_at.slice(0, 10));
  return row;
}

export async function deleteComplianceSignature(childId: number, formKey: ComplianceFormKey): Promise<void> {
  await sql`DELETE FROM compliance_signatures WHERE child_id = ${childId} AND form_key = ${formKey}`;
  await setSignedFlag(childId, formKey, false, null);
}
