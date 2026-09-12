import { sql } from './db';
import type { EmploymentStatus } from './staff-data';

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
      u.dob::text, u.start_date::text, u.end_date::text, u.position_title, u.phone, u.address, u.nationality,
      u.emergency_contact_name, u.emergency_contact_phone, u.cv_url, u.contract_url, u.qualifications,
      u.visa_status, u.kitas_number, u.kitas_expiry::text, u.passport_copy_url,
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
}

export async function getPayslipsForStaff(adminUserId: number): Promise<PayslipSummary[]> {
  return (await sql`
    SELECT id, admin_user_id, period_label, uploaded_at::text
    FROM staff_payslips WHERE admin_user_id = ${adminUserId}
    ORDER BY uploaded_at DESC
  `) as unknown as PayslipSummary[];
}

export async function addPayslip(adminUserId: number, periodLabel: string, fileUrl: string, uploadedBy: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO staff_payslips (admin_user_id, period_label, file_url, uploaded_by)
    VALUES (${adminUserId}, ${periodLabel}, ${fileUrl}, ${uploadedBy})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function deletePayslip(id: number): Promise<void> {
  await sql`DELETE FROM staff_payslips WHERE id = ${id}`;
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

export interface StaffLunchOrder {
  id: number;
  own_lunch: boolean;
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
    SELECT id, own_lunch, start_date::text, end_date::text, monday, tuesday, wednesday, thursday, friday,
      lunch_size, food_preference, allergies_notes, lunch_count, created_at::text
    FROM staff_lunch_orders WHERE admin_user_id = ${adminUserId}
    ORDER BY created_at DESC
  `) as unknown as StaffLunchOrder[];
}

export async function createStaffOwnLunchRecord(adminUserId: number): Promise<void> {
  await sql`INSERT INTO staff_lunch_orders (admin_user_id, own_lunch) VALUES (${adminUserId}, true)`;
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
