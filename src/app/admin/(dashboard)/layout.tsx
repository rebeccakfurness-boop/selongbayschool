import type { ReactNode } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { getCurrentStaff } from '@/lib/current-staff';

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const staff = await getCurrentStaff();
  return (
    <div className="flex min-h-screen bg-cream print:bg-white">
      <AdminSidebar role={staff.role} />
      <main className="flex-1 overflow-x-auto px-8 py-10 print:p-0">{children}</main>
    </div>
  );
}
