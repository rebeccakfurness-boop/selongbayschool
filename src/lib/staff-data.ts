export type EmploymentStatus = 'applicant' | 'casual_employee' | 'teaching_staff' | 'admin_staff' | 'past_employee';

/** Fixed color legend for the Teacher Board (mirrors STATUS_LEGEND in family-data.ts). */
export const EMPLOYMENT_STATUS_LEGEND: Record<EmploymentStatus, { label: string; badgeClass: string; dotClass: string }> = {
  applicant: { label: 'Applicants', badgeClass: 'bg-sand text-ink-soft', dotClass: 'bg-ink-soft' },
  casual_employee: { label: 'Casual Employees', badgeClass: 'bg-orange/20 text-orange-deep', dotClass: 'bg-orange' },
  teaching_staff: { label: 'Teaching Staff', badgeClass: 'bg-teal/15 text-teal-deep', dotClass: 'bg-teal' },
  admin_staff: { label: 'Admin Staff', badgeClass: 'bg-lightteal/20 text-teal-deep', dotClass: 'bg-lightteal' },
  past_employee: { label: 'Past Employees', badgeClass: 'bg-ink/10 text-ink-soft', dotClass: 'bg-ink-soft' },
};

export const EMPLOYMENT_STATUS_ORDER: EmploymentStatus[] = [
  'applicant',
  'casual_employee',
  'teaching_staff',
  'admin_staff',
  'past_employee',
];

export const BPJS_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  not_applicable: 'Not applicable',
};
