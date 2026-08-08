import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/current-staff';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import BudgetPasswordGate from '@/components/admin/BudgetPasswordGate';

export const dynamic = 'force-dynamic';

/** Every /admin/budget/* page needs a normal admin login (requireAdmin — a teacher account is
 * rejected here same as anywhere else admin-only) AND the separate budget password, since this
 * is meant for the Principal specifically, not every admin account. */
export default async function BudgetLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());

  if (!session.budgetUnlocked) {
    return <BudgetPasswordGate />;
  }

  return <>{children}</>;
}
