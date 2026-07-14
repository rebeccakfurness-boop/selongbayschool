import type { ReactNode } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar />
      <main className="flex-1 overflow-x-auto px-8 py-10">{children}</main>
    </div>
  );
}
