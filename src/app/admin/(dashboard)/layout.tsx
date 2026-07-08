import type { ReactNode } from 'react';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
