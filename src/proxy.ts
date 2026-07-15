import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import {
  getSessionOptions,
  getCustomerSessionOptions,
  type AdminSessionData,
  type CustomerSessionData,
} from '@/lib/auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
const PUBLIC_ADMIN_API_PATHS = ['/api/admin/login', '/api/admin/forgot-password', '/api/admin/reset-password'];
const PUBLIC_ACCOUNT_PATHS = ['/account/login', '/account/signup'];

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*'],
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
