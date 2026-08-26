import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getSchoolPolicies } from '@/lib/policies';
import SchoolPoliciesManager from '@/components/admin/SchoolPoliciesManager';

export const dynamic = 'force-dynamic';

export default async function AdminPoliciesPage() {
  await ensureSchema();
  await getCurrentStaff();

  const policies = await getSchoolPolicies();

  return (
    <section>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">School Policies</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
          Links to the school&apos;s policy documents (safeguarding, code of conduct, uniform, and so on),
          kept in the school Google Drive. What&apos;s listed here shows up for every parent under Policies
          in their portal.
        </p>
      </div>
      <div className="mt-6">
        <SchoolPoliciesManager initial={policies} />
      </div>
    </section>
  );
}
