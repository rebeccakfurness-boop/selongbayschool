import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/current-staff';

/** Full calendar scope (not one of the narrower calendar.readonly / calendar.events splits) since
 * this integration both reads free/busy and writes events with Google Meet conference data. */
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email'];

export const STATE_COOKIE_NAME = 'sbs_calendar_oauth_state';

export async function GET() {
  await requireAdmin();

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_REDIRECT_URI are not set.' },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString('hex');
  const jar = await cookies();
  jar.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
