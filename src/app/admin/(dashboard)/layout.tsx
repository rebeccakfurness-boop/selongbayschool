import type { ReactNode } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { getCurrentStaff } from '@/lib/current-staff';

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const staff = await getCurrentStaff();
  return (
    <div className="min-h-screen bg-cream print:bg-white md:flex">
      <AdminSidebar role={staff.role} />
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-6 md:px-8 md:py-10 print:p-0">{children}</main>
    </div>
  );
}
