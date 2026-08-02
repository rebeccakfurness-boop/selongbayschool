'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/** Every other logged-in area (admin, parent portal, student) still gets the marketing site's
 * header/footer around it — /kiosk is the one exception. It's a walk-up, no-login tablet fixed at
 * the school gate; the marketing nav (links to Admissions, About, etc.) would let a curious kid
 * tap away from the check-in flow entirely, with no way back except someone retyping the URL. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/kiosk')) {
    return <>{children}</>;
  }
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
