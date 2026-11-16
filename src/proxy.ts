import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import {
  getSessionOptions,
  getCustomerSessionOptions,
  getStudentSessionOptions,
  getSeranganSessionOptions,
  type AdminSessionData,
  type CustomerSessionData,
  type StudentSessionData,
  type SeranganSessionData,
} from '@/lib/auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
const PUBLIC_ADMIN_API_PATHS = [
  '/api/admin/login',
  '/api/admin/forgot-password',
  '/api/admin/reset-password',
  // Reached by a plain link click before any admin session exists — same "remember this device"
  // flow /account/login uses, just for staff (see /admin/login and /teacher/login's own peek).
  '/api/admin/device-login',
  '/api/admin/device-login/forget',
];
const PUBLIC_ACCOUNT_PATHS = ['/account/login', '/account/signup'];
const PUBLIC_STUDENT_PATHS = ['/student/login'];
const PUBLIC_SERANGAN_PATHS = ['/serangan/login', '/serangan/forgot-password', '/serangan/reset-password'];
const PUBLIC_SERANGAN_API_PATHS = ['/api/serangan/login', '/api/serangan/forgot-password', '/api/serangan/reset-password'];

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/account/:path*',
    '/student/:path*',
    '/serangan/:path*',
    '/api/serangan/:path*',
    '/kiosk/:path*',
    '/api/kiosk/:path*',
  ],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/account' || pathname.startsWith('/account/')) {
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

  if (pathname === '/student' || pathname.startsWith('/student/')) {
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

  // The Serangan English School dashboard -- a fully separate login from the main school admin
  // (see the SeranganSessionData comment in lib/auth.ts for why), so it gets its own branch here
  // rather than falling into the admin check below.
  if (pathname === '/serangan' || pathname.startsWith('/serangan/') || pathname.startsWith('/api/serangan/')) {
    if (PUBLIC_SERANGAN_PATHS.includes(pathname) || PUBLIC_SERANGAN_API_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const res = NextResponse.next();
    const session = await getIronSession<SeranganSessionData>(req, res, await getSeranganSessionOptions());
    if (!session.seranganAdminId) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
      }
      const loginUrl = new URL('/serangan/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  if (PUBLIC_ADMIN_PATHS.includes(pathname) || PUBLIC_ADMIN_API_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Everything else — including /kiosk and /api/kiosk/* — needs a staff session. The gate kiosk
  // used to unlock with its own shared PIN (no way to know *which* staff member was present); now
  // it just needs a staff member logged in via the normal /admin/login, same as any other admin
  // page, so an admin-recorded check-in at the gate can be attributed to a real person. That also
  // means an unauthenticated visit to /kiosk redirects to /admin/login like any other admin page.
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
