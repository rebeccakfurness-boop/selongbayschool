import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import {
  getSessionOptions,
  getCustomerSessionOptions,
  getStudentSessionOptions,
  getKioskSessionOptions,
  type AdminSessionData,
  type CustomerSessionData,
  type StudentSessionData,
  type KioskSessionData,
} from '@/lib/auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
const PUBLIC_ADMIN_API_PATHS = ['/api/admin/login', '/api/admin/forgot-password', '/api/admin/reset-password'];
const PUBLIC_ACCOUNT_PATHS = ['/account/login', '/account/signup'];
const PUBLIC_STUDENT_PATHS = ['/student/login'];
const PUBLIC_KIOSK_PATHS = ['/kiosk/unlock'];
const PUBLIC_KIOSK_API_PATHS = ['/api/kiosk/unlock'];

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*', '/student/:path*', '/kiosk/:path*', '/api/kiosk/:path*'],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/account/')) {
    if (PUBLIC_ACCOUNT_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const res = NextResponse.next();
    const session = await getIronSession<CustomerSessionData>(req, res, await getCustomerSessionOptions());
    if (!session.customerId) {
      const loginUrl = new URL('/account/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  // The gate tablet has no login of any kind — just a shared PIN (see /kiosk/unlock) that unlocks
  // this specific browser. Deliberately not linked from anywhere else in the site: staff set the
  // tablet's browser to this URL once and it stays unlocked, same idea as the admin/customer/
  // student guards above but with a device-scoped session instead of a person-scoped one.
  if (pathname.startsWith('/kiosk/') || pathname.startsWith('/api/kiosk/')) {
    if (PUBLIC_KIOSK_PATHS.includes(pathname) || PUBLIC_KIOSK_API_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const res = NextResponse.next();
    const session = await getIronSession<KioskSessionData>(req, res, await getKioskSessionOptions());
    if (!session.unlocked) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Kiosk locked.' }, { status: 401 });
      }
      const unlockUrl = new URL('/kiosk/unlock', req.url);
      return NextResponse.redirect(unlockUrl);
    }
    return res;
  }

  if (pathname.startsWith('/student/')) {
    if (PUBLIC_STUDENT_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const res = NextResponse.next();
    const session = await getIronSession<StudentSessionData>(req, res, await getStudentSessionOptions());
    if (!session.studentAccountId) {
      const loginUrl = new URL('/student/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  if (PUBLIC_ADMIN_PATHS.includes(pathname) || PUBLIC_ADMIN_API_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<AdminSessionData>(req, res, await getSessionOptions());

  if (!session.adminUserId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}
