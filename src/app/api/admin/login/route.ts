import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, checkAdminPassword, createSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error('[api/admin/login] ADMIN_PASSWORD is not configured');
    return NextResponse.json({ error: 'Admin login is not configured yet.' }, { status: 500 });
  }

  if (!body.password || !checkAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}
