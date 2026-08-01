import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import ChangePasswordForm from '@/components/admin/ChangePasswordForm';
import SchoolSettingsForm, { type SchoolSettings } from '@/components/admin/SchoolSettingsForm';
import LunchSettingsForm, { type LunchSettings } from '@/components/admin/LunchSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const [settings] = staff.role === 'admin' ? ((await sql`SELECT * FROM school_settings WHERE id = 1`) as unknown as SchoolSettings[]) : [];
  const [lunchSettings] = staff.role === 'admin' ? ((await sql`SELECT * FROM lunch_settings WHERE id = 1`) as unknown as LunchSettings[]) : [];

  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-soft">Manage your account{staff.role === 'admin' ? ' and school-wide invoicing details' : ''}.</p>

      <div className="mt-6 flex flex-col gap-6">
        <ChangePasswordForm />
        {staff.role === 'admin' && settings && <SchoolSettingsForm initial={settings} />}
        {staff.role === 'admin' && lunchSettings && <LunchSettingsForm initial={lunchSettings} />}
      </div>
    </section>
  );
}
