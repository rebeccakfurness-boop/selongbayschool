import { renderToBuffer } from '@react-pdf/renderer';
import { put } from '@vercel/blob';
import { sql } from './db';
import type { EmploymentStatus } from './staff-data';
import { computeStaffAttendanceForPeriod } from './staff-attendance';
import { PayslipDocument } from './pdf/PayslipDocument';

export interface StaffBoardRow {
  id: number;
  email: string;
  display_name: string | null;
  role: 'admin' | 'teacher';
  employment_status: EmploymentStatus;
  is_active: boolean;
  position_title: string | null;
  start_date: string | null;
  phone: string | null;
  assigned_classes: string[];
}

/** Every staff member, for the Teacher Board -- teacher class assignments are aggregated in so a
 * card can show them without a query per card, same pattern as the existing Staff Accounts page. */
export async function getStaffForBoard(): Promise<StaffBoardRow[]> {
  return (await sql`
    SELECT u.id, u.email, u.display_name, u.role, u.employment_status, u.is_active, u.position_title, u.start_date::text, u.phone,
      COALESCE(array_agg(ta.class_name) FILTER (WHERE ta.class_name IS NOT NULL), '{}') AS assigned_classes
    FROM admin_users u
    LEFT JOIN teacher_assignments ta ON ta.admin_user_id = u.id
    GROUP BY u.id
    ORDER BY u.display_name, u.email
  `) as unknown as StaffBoardRow[];
}

export interface StaffDetail {
  id: number;
  email: string;
  display_name: string | null;
  role: 'admin' | 'teacher';
  employment_status: EmploymentStatus;
  is_active: boolean;
  dob: string | null;
  start_date: string | null;
  end_date: string | null;
  position_title: string | null;
  phone: string | null;
  address: string | null;
  postal_address: string | null;
  nationality: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  cv_url: string | null;
  contract_url: string | null;
  qualifications: string | null;
  visa_status: string | null;
  kitas_number: string | null;
  kitas_expiry: string | null;
  passport_copy_url: string | null;
  npwp_number: string | null;
  tax_status: string | null;
  npwp_url: string | null;
  national_id_url: string | null;
  family_card_url: string | null;
  bpjs_kesehatan_number: string | null;
  bpjs_kesehatan_status: string | null;
  bpjs_ketenagakerjaan_number: string | null;
  bpjs_ketenagakerjaan_status: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  hr_notes: string | null;
  assigned_classes: string[];
}

export async function getStaffDetail(adminUserId: number): Promise<StaffDetail | null> {
  const rows = (await sql`
    SELECT u.id, u.email, u.display_name, u.role, u.employment_status, u.is_active,
      u.dob::text, u.start_date::text, u.end_date::text, u.position_title, u.phone, u.address, u.postal_address, u.nationality,
      u.emergency_contact_name, u.emergency_contact_phone, u.cv_url, u.contract_url, u.qualifications,
      u.visa_status, u.kitas_number, u.kitas_expiry::text, u.passport_copy_url,
      u.npwp_number, u.tax_status, u.npwp_url, u.national_id_url, u.family_card_url,
      u.bpjs_kesehatan_number, u.bpjs_kesehatan_status, u.bpjs_ketenagakerjaan_number, u.bpjs_ketenagakerjaan_status,
      u.bank_name, u.bank_account_number, u.bank_account_name, u.hr_notes,
      COALESCE(array_agg(ta.class_name) FILTER (WHERE ta.class_name IS NOT NULL), '{}') AS assigned_classes
    FROM admin_users u
    LEFT JOIN teacher_assignments ta ON ta.admin_user_id = u.id
    WHERE u.id = ${adminUserId}
    GROUP BY u.id
  `) as unknown as StaffDetail[];
  return rows[0] ?? null;
}

export interface ProfessionalDevelopmentEntry {
  id: number;
  admin_user_id: number;
  title: string;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes: string | null;
  certificate_url: string | null;
}

export async function getProfessionalDevelopmentForStaff(adminUserId: number): Promise<ProfessionalDevelopmentEntry[]> {
  return (await sql`
    SELECT id, admin_user_id, title, provider, start_date::text, end_date::text, status, notes, certificate_url
    FROM staff_professional_development WHERE admin_user_id = ${adminUserId}
    ORDER BY start_date DESC NULLS LAST, id DESC
  `) as unknown as ProfessionalDevelopmentEntry[];
}

export async function addProfessionalDevelopment(
  adminUserId: number,
  entry: { title: string; provider: string | null; startDate: string | null; endDate: string | null; status: string; notes: string | null }
): Promise<number> {
  const rows = (await sql`
    INSERT INTO staff_professional_development (admin_user_id, title, provider, start_date, end_date, status, notes)
    VALUES (${adminUserId}, ${entry.title}, ${entry.provider}, ${entry.startDate}, ${entry.endDate}, ${entry.status}, ${entry.notes})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function deleteProfessionalDevelopment(id: number): Promise<void> {
  await sql`DELETE FROM staff_professional_development WHERE id = ${id}`;
}

export interface PayslipSummary {
  id: number;
  admin_user_id: number;
  period_label: string;
  uploaded_at: string;
  gross_salary: string | null;
  take_home_pay: string | null;
}

export async function getPayslipsForStaff(adminUserId: number): Promise<PayslipSummary[]> {
  return (await sql`
    SELECT id, admin_user_id, period_label, uploaded_at::text, gross_salary, take_home_pay
    FROM staff_payslips WHERE admin_user_id = ${adminUserId}
    ORDER BY uploaded_at DESC
  `) as unknown as PayslipSummary[];
}

export async function deletePayslip(id: number): Promise<void> {
  await sql`DELETE FROM staff_payslips WHERE id = ${id}`;
}

/** BPJS Ketenagakerjaan statutory splits that are safe to default (fixed percentages set by
 * regulation, not case-specific): JHT 2% employee / 3.7% employer, JP 1% employee / 2% employer,
 * JKM 0.3% employer. JKK's employer rate depends on the school's registered work-accident risk
 * classification (0.24%-1.74%) -- there's no single correct default, so it's an admin-entered
 * input on the generation form instead. PPh 21 and any loan/cashbon repayment are entered
 * directly too: PPh 21 is a progressive, legally sensitive calculation this app doesn't attempt,
 * and a loan deduction is inherently case-specific. */
const JHT_EMPLOYEE_RATE = 0.02;
const JP_EMPLOYEE_RATE = 0.01;
const JHT_EMPLOYER_RATE = 0.037;
const JP_EMPLOYER_RATE = 0.02;
const JKM_EMPLOYER_RATE = 0.003;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface GeneratePayslipInput {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  basicSalary: number;
  housingAllowance: number;
  pph21Deduction: number;
  loanDeduction: number;
  jkkRatePercent: number;
}

/** Computes every payroll figure (BPJS wage base = basic salary only -- housing allowance is kept
 * out of every deduction/contribution calculation entirely, and only ever added on top for Gross
 * Salary and Take Home Pay), renders the payslip PDF, uploads it to blob storage, and stores both
 * the figures and the file_url on one staff_payslips row -- the generated replacement for the old
 * "upload an already-prepared PDF" flow. Everything downstream (the DOB-gated view/download
 * route, delete) is unchanged; it only ever looked at file_url. */
export async function generatePayslip(adminUserId: number, input: GeneratePayslipInput, generatedByAdminId: number): Promise<number> {
  // Independent reads run in parallel -- one less sequential round trip on a cold serverless
  // function, alongside the PDF render, Blob upload, and insert that still have to happen in order.
  const [staff, attendance] = await Promise.all([
    getStaffDetail(adminUserId),
    computeStaffAttendanceForPeriod(adminUserId, input.periodStart, input.periodEnd),
  ]);
  if (!staff) throw new Error('Staff member not found.');

  const grossSalary = round2(input.basicSalary + input.housingAllowance);
  const jhtEmployeeDeduction = round2(input.basicSalary * JHT_EMPLOYEE_RATE);
  const jpEmployeeDeduction = round2(input.basicSalary * JP_EMPLOYEE_RATE);
  const jhtEmployerContribution = round2(input.basicSalary * JHT_EMPLOYER_RATE);
  const jpEmployerContribution = round2(input.basicSalary * JP_EMPLOYER_RATE);
  const jkmEmployerContribution = round2(input.basicSalary * JKM_EMPLOYER_RATE);
  const jkkEmployerContribution = round2(input.basicSalary * (input.jkkRatePercent / 100));
  const takeHomePay = round2(grossSalary - jhtEmployeeDeduction - jpEmployeeDeduction - input.pph21Deduction - input.loanDeduction);

  const staffName = staff.display_name ?? staff.email;

  const pdfBuffer = await renderToBuffer(
    PayslipDocument({
      payslip: {
        staffName,
        positionTitle: staff.position_title,
        periodLabel: input.periodLabel,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        workingDays: attendance.workingDays,
        daysPresent: attendance.daysPresent,
        basicSalary: input.basicSalary,
        housingAllowance: input.housingAllowance,
        grossSalary,
        jhtEmployeeDeduction,
        jpEmployeeDeduction,
        pph21Deduction: input.pph21Deduction,
        loanDeduction: input.loanDeduction,
        takeHomePay,
        jhtEmployerContribution,
        jpEmployerContribution,
        jkmEmployerContribution,
        jkkEmployerContribution,
        bankName: staff.bank_name,
        bankAccountNumber: staff.bank_account_number,
        bankAccountName: staff.bank_account_name,
      },
    })
  );

  const safeSlug =
    input.periodLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'payslip';
  const blob = await put(`staff/${adminUserId}/payslips/${safeSlug}.pdf`, pdfBuffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/pdf',
  });

  const rows = (await sql`
    INSERT INTO staff_payslips (
      admin_user_id, period_label, file_url, uploaded_by,
      period_start, period_end, working_days, days_present,
      basic_salary, housing_allowance, gross_salary,
      jht_employee_deduction, jp_employee_deduction, pph21_deduction, loan_deduction, take_home_pay,
      jht_employer_contribution, jp_employer_contribution, jkm_employer_contribution, jkk_employer_contribution,
      bank_name, bank_account_number, bank_account_name
    )
    VALUES (
      ${adminUserId}, ${input.periodLabel}, ${blob.url}, ${generatedByAdminId},
      ${input.periodStart}::date, ${input.periodEnd}::date, ${attendance.workingDays}, ${attendance.daysPresent},
      ${input.basicSalary}, ${input.housingAllowance}, ${grossSalary},
      ${jhtEmployeeDeduction}, ${jpEmployeeDeduction}, ${input.pph21Deduction}, ${input.loanDeduction}, ${takeHomePay},
      ${jhtEmployerContribution}, ${jpEmployerContribution}, ${jkmEmployerContribution}, ${jkkEmployerContribution},
      ${staff.bank_name}, ${staff.bank_account_number}, ${staff.bank_account_name}
    )
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

/** For the DOB-gated download route -- joins the owning staff member's dob in the same query so
 * the route can check it without a second round trip. */
export async function getPayslipWithOwnerDob(payslipId: number): Promise<{ admin_user_id: number; file_url: string; period_label: string; dob: string | null } | null> {
  const rows = (await sql`
    SELECT p.admin_user_id, p.file_url, p.period_label, u.dob::text
    FROM staff_payslips p JOIN admin_users u ON u.id = p.admin_user_id
    WHERE p.id = ${payslipId}
  `) as unknown as { admin_user_id: number; file_url: string; period_label: string; dob: string | null }[];
  return rows[0] ?? null;
}

/** For the "Email to staff member" action -- same join shape as getPayslipWithOwnerDob, but
 * pulling contact details (email + a display name) instead of dob. */
export async function getPayslipWithStaffContact(
  payslipId: number
): Promise<{ admin_user_id: number; file_url: string; period_label: string; email: string; display_name: string | null } | null> {
  const rows = (await sql`
    SELECT p.admin_user_id, p.file_url, p.period_label, u.email, u.display_name
    FROM staff_payslips p JOIN admin_users u ON u.id = p.admin_user_id
    WHERE p.id = ${payslipId}
  `) as unknown as { admin_user_id: number; file_url: string; period_label: string; email: string; display_name: string | null }[];
  return rows[0] ?? null;
}

export interface StaffLunchOrder {
  id: number;
  own_lunch: boolean;
  lunch_type: 'school_lunch' | 'nasi_bungkus' | 'own_lunch';
  start_date: string | null;
  end_date: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  lunch_size: 'normal' | 'large' | null;
  food_preference: string | null;
  allergies_notes: string | null;
  lunch_count: number | null;
  created_at: string;
}

export async function getStaffLunchOrders(adminUserId: number): Promise<StaffLunchOrder[]> {
  return (await sql`
    SELECT id, own_lunch, lunch_type, start_date::text, end_date::text, monday, tuesday, wednesday, thursday, friday,
      lunch_size, food_preference, allergies_notes, lunch_count, created_at::text
    FROM staff_lunch_orders WHERE admin_user_id = ${adminUserId}
    ORDER BY created_at DESC
  `) as unknown as StaffLunchOrder[];
}

export async function createStaffOwnLunchRecord(adminUserId: number): Promise<void> {
  await sql`INSERT INTO staff_lunch_orders (admin_user_id, own_lunch, lunch_type) VALUES (${adminUserId}, true, 'own_lunch')`;
}

export async function createStaffNasiBungkusRecord(adminUserId: number): Promise<void> {
  await sql`INSERT INTO staff_lunch_orders (admin_user_id, own_lunch, lunch_type) VALUES (${adminUserId}, false, 'nasi_bungkus')`;
}

export async function createStaffLunchOrder(
  adminUserId: number,
  order: {
    startDate: string;
    endDate: string;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    lunchSize: 'normal' | 'large';
    foodPreference: string | null;
    allergiesNotes: string | null;
    lunchCount: number;
  }
): Promise<void> {
  await sql`
    INSERT INTO staff_lunch_orders
      (admin_user_id, own_lunch, start_date, end_date, monday, tuesday, wednesday, thursday, friday, lunch_size, food_preference, allergies_notes, lunch_count)
    VALUES (
      ${adminUserId}, false, ${order.startDate}, ${order.endDate}, ${order.monday}, ${order.tuesday}, ${order.wednesday}, ${order.thursday}, ${order.friday},
      ${order.lunchSize}, ${order.foodPreference}, ${order.allergiesNotes}, ${order.lunchCount}
    )
  `;
}
