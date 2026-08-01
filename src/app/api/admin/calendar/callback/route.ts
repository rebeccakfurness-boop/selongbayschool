import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { STATE_COOKIE_NAME } from '../connect/route';

export async function GET(req: NextRequest) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/families', req.url));
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE_NAME)?.value;
  jar.delete(STATE_COOKIE_NAME);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/admin/calendar?error=state_mismatch', req.url));
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/admin/calendar?error=not_configured', req.url));
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      console.error('[calendar/callback] token exchange failed', await tokenRes.text());
      return NextResponse.redirect(new URL('/admin/calendar?error=token_exchange_failed', req.url));
    }
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokens.refresh_token) {
      // Google only issues a refresh_token on first consent (or with prompt=consent, which the
      // connect route always sends) — without it the connection can't renew itself once the access
      // token expires (~1 hour), so surface it rather than silently storing a token that will
      // quietly stop working.
      return NextResponse.redirect(new URL('/admin/calendar?error=no_refresh_token', req.url));
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = (await userInfoRes.json().catch(() => ({}))) as { email?: string };
    if (!userInfo.email) {
      return NextResponse.redirect(new URL('/admin/calendar?error=unexpected', req.url));
    }

    await ensureSchema();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    // The connected account's own primary calendar ID is just its email address — no separate
    // calendar picker needed, this is "the school's Gmail calendar" the feature was asked for.
    await sql`
      INSERT INTO calendar_connection (id, google_account_email, calendar_id, access_token, access_token_expires_at, refresh_token, connected_by)
      VALUES (1, ${userInfo.email}, ${userInfo.email}, ${tokens.access_token}, ${expiresAt}::timestamptz, ${tokens.refresh_token}, ${staff.adminUserId})
      ON CONFLICT (id) DO UPDATE SET
        google_account_email = EXCLUDED.google_account_email,
        calendar_id = EXCLUDED.calendar_id,
        access_token = EXCLUDED.access_token,
        access_token_expires_at = EXCLUDED.access_token_expires_at,
        refresh_token = EXCLUDED.refresh_token,
        connected_by = EXCLUDED.connected_by,
        connected_at = now()
    `;

    return NextResponse.redirect(new URL('/admin/calendar?connected=1', req.url));
  } catch (err) {
    console.error('[calendar/callback] failed', err);
    return NextResponse.redirect(new URL('/admin/calendar?error=unexpected', req.url));
  }
}
