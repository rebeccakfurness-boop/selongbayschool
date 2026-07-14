import type { SessionOptions } from 'iron-session';

export const ADMIN_COOKIE_NAME = 'sbs_admin_session';
export const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export interface AdminSessionData {
  adminUserId?: number;
  email?: string;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * iron-session requires a password of at least 32 characters. Deriving a
 * stable 64-character hex digest from whatever secret is already configured
 * means ADMIN_SESSION_SECRET (or ADMIN_PASSWORD) can be reused as-is, rather
 * than requiring a separately provisioned long random string.
 */
async function derivedSessionPassword(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return bufferToHex(digest);
}

export async function getSessionOptions(): Promise<SessionOptions> {
  return {
    cookieName: ADMIN_COOKIE_NAME,
    password: await derivedSessionPassword(),
    ttl: 60 * 60 * 12, // 12 hours
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}
