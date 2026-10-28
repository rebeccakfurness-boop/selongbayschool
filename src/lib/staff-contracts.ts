import { renderToBuffer } from '@react-pdf/renderer';
import { put } from '@vercel/blob';
import { sql } from './db';
import { ContractDocument, type ContractData, type ContractSignatureData } from './pdf/ContractDocument';
import type { GenerateStaffContractInput } from './validation';

/** The fixed access code gating every signed/uploaded contract (see the schema comment on
 * staff_contracts in lib/db.ts for why this is an application-level gate, not a real
 * PDF-embedded open password). Not an env var: the school asked for one specific shared code,
 * not a per-deployment secret, and it's checked server-side in the download route below -- never
 * trust a client-supplied "the PIN matched". */
const CONTRACT_ACCESS_CODE = '2027';

export function isValidContractAccessCode(pin: string): boolean {
  return pin.trim() === CONTRACT_ACCESS_CODE;
}

export interface StaffContractSummary {
  id: number;
  admin_user_id: number;
  title: string;
  source: 'generated' | 'uploaded';
  status: 'draft' | 'sent' | 'signed' | 'uploaded';
  locked: boolean;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface StaffContractRow extends StaffContractSummary {
  position_title: string | null;
  role_summary: string | null;
  target_group: string | null;
  work_days: string | null;
  working_hours_per_day: string | null;
  salary_idr: string | null;
  term_end_date: string | null;
  ktp_number: string | null;
  employee_address: string | null;
  signed_place: string | null;
  additional_terms: string | null;
  file_url: string | null;
  signed_by_name: string | null;
  signature_data_url: string | null;
}

/** Drafts are an admin-only staging area (still being written, not yet shown to the staff
 * member) -- the staff member's own portal view never includes them, same convention as
 * letters_of_offer's draft status never reaching the family-facing accept page. */
export async function getContractsForStaff(adminUserId: number, includeDrafts: boolean): Promise<StaffContractSummary[]> {
  if (includeDrafts) {
    return (await sql`
      SELECT id, admin_user_id, title, source, status, locked, sent_at::text, signed_at::text, created_at::text
      FROM staff_contracts WHERE admin_user_id = ${adminUserId} ORDER BY created_at DESC
    `) as unknown as StaffContractSummary[];
  }
  return (await sql`
    SELECT id, admin_user_id, title, source, status, locked, sent_at::text, signed_at::text, created_at::text
    FROM staff_contracts
    WHERE admin_user_id = ${adminUserId} AND status != 'draft'
    ORDER BY created_at DESC
  `) as unknown as StaffContractSummary[];
}

export async function getContract(id: number): Promise<StaffContractRow | null> {
  const rows = (await sql`
    SELECT id, admin_user_id, title, source, status, locked, sent_at::text, signed_at::text, created_at::text,
      position_title, role_summary, target_group, work_days, working_hours_per_day, salary_idr,
      term_end_date::text, ktp_number, employee_address, signed_place, additional_terms,
      file_url, signed_by_name, signature_data_url
    FROM staff_contracts WHERE id = ${id}
  `) as unknown as StaffContractRow[];
  return rows[0] ?? null;
}

async function renderAndUpload(adminUserId: number, title: string, data: ContractData, signature: ContractSignatureData | null): Promise<string> {
  const pdfBuffer = await renderToBuffer(ContractDocument({ data, signature }));
  const safeSlug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'contract';
  const blob = await put(`staff/${adminUserId}/contracts/${safeSlug}.pdf`, pdfBuffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/pdf',
  });
  return blob.url;
}

function toContractData(employeeName: string, input: GenerateStaffContractInput): ContractData {
  return {
    employeeName,
    positionTitle: input.positionTitle,
    roleSummary: input.roleSummary || null,
    targetGroup: input.targetGroup || null,
    workDays: input.workDays || null,
    workingHoursPerDay: input.workingHoursPerDay || null,
    salaryIdr: input.salaryIdr,
    termEndDate: input.termEndDate,
    ktpNumber: input.ktpNumber || null,
    employeeAddress: input.employeeAddress || null,
    signedPlace: input.signedPlace || null,
    additionalTerms: input.additionalTerms || null,
  };
}

/** Renders the unsigned agreement from the template and admin-entered fields, uploads it, and
 * stores both the rendered PDF and every field it was built from (so the contract can be
 * re-rendered with a signature later without re-asking the admin for anything). status is 'sent'
 * when the admin chose to send it straight to the staff member's portal, otherwise 'draft'. */
export async function generateContract(
  adminUserId: number,
  employeeName: string,
  input: GenerateStaffContractInput,
  createdByAdminId: number
): Promise<number> {
  const data = toContractData(employeeName, input);
  const fileUrl = await renderAndUpload(adminUserId, input.title, data, null);
  const status = input.send ? 'sent' : 'draft';

  const rows = (await sql`
    INSERT INTO staff_contracts (
      admin_user_id, title, source, status,
      position_title, role_summary, target_group, work_days, working_hours_per_day,
      salary_idr, term_end_date, ktp_number, employee_address, signed_place, additional_terms,
      file_url, sent_at, created_by
    )
    VALUES (
      ${adminUserId}, ${input.title}, 'generated', ${status},
      ${input.positionTitle}, ${data.roleSummary}, ${data.targetGroup}, ${data.workDays}, ${data.workingHoursPerDay},
      ${input.salaryIdr}, ${input.termEndDate}::date, ${data.ktpNumber}, ${data.employeeAddress}, ${data.signedPlace}, ${data.additionalTerms},
      ${fileUrl}, ${input.send ? new Date().toISOString() : null}, ${createdByAdminId}
    )
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

/** Moves an existing draft to 'sent' -- re-renders nothing (the draft's PDF is already the
 * correct unsigned copy), just flips status/sent_at so it starts showing up on the staff
 * member's own portal view. */
export async function sendContract(id: number): Promise<void> {
  await sql`UPDATE staff_contracts SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = ${id} AND status = 'draft'`;
}

/** Re-renders the agreement with the captured signature embedded, uploads it as the new
 * file_url (the unsigned copy is superseded, not kept -- nothing else in the app links to the
 * old blob URL), and locks the row. */
export async function signContract(id: number, employeeName: string, signedByName: string, signatureDataUrl: string): Promise<void> {
  const contract = await getContract(id);
  if (!contract) throw new Error('Contract not found.');
  if (contract.source !== 'generated') throw new Error('Only a generated contract can be signed in-portal.');

  const data = toContractData(employeeName, {
    title: contract.title,
    positionTitle: contract.position_title ?? '',
    roleSummary: contract.role_summary ?? '',
    targetGroup: contract.target_group ?? '',
    workDays: contract.work_days ?? '',
    workingHoursPerDay: contract.working_hours_per_day ?? '',
    salaryIdr: Number(contract.salary_idr ?? 0),
    termEndDate: contract.term_end_date ?? '',
    ktpNumber: contract.ktp_number ?? '',
    employeeAddress: contract.employee_address ?? '',
    signedPlace: contract.signed_place ?? '',
    additionalTerms: contract.additional_terms ?? '',
    send: true,
  });

  const signedAt = new Date().toISOString();
  const fileUrl = await renderAndUpload(contract.admin_user_id, contract.title, data, { signedByName, signatureDataUrl, signedAt });

  await sql`
    UPDATE staff_contracts
    SET status = 'signed', file_url = ${fileUrl}, signed_by_name = ${signedByName}, signature_data_url = ${signatureDataUrl},
        signed_at = ${signedAt}, locked = true, updated_at = now()
    WHERE id = ${id}
  `;
}

/** An already-executed contract an admin uploads directly (e.g. signed on paper and scanned) --
 * stored straight into file_url, no PDF generation, locked immediately since it's taken to
 * already be the final signed copy. */
export async function uploadSignedContract(adminUserId: number, title: string, fileUrl: string, createdByAdminId: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO staff_contracts (admin_user_id, title, source, status, file_url, signed_at, locked, created_by)
    VALUES (${adminUserId}, ${title}, 'uploaded', 'uploaded', ${fileUrl}, now(), true, ${createdByAdminId})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function deleteContract(id: number): Promise<void> {
  await sql`DELETE FROM staff_contracts WHERE id = ${id}`;
}
