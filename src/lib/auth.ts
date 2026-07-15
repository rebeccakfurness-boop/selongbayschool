import type { SessionOptions } from 'iron-session';

export const ADMIN_COOKIE_NAME = 'sbs_admin_session';
export const CUSTOMER_COOKIE_NAME = 'sbs_customer_session';
export const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour
export const MAGIC_LINK_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export interface AdminSessionData {
  adminUserId?: number;
  email?: string;
}

export interface CustomerSessionData {
  customerId?: number;
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
 * means ADMIN_SESSION_SECRET can be reused as-is, rather than requiring a
 * separately provisioned long random string. `salt` domain-separates the
 * admin and customer session passwords from the same underlying secret, so
 * an admin session cookie and a customer session cookie can never decode
 * as each other even though they share one configured env var.
 */
async function derivedSessionPassword(salt: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}|${salt}`));
  return bufferToHex(digest);
}

export async function getSessionOptions(): Promise<SessionOptions> {
  return {
    cookieName: ADMIN_COOKIE_NAME,
    password: await derivedSessionPassword('admin'),
    ttl: 60 * 60 * 12, // 12 hours
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

/** Only ever a same-site relative path, never an absolute/protocol-relative URL, to avoid an open redirect. */
export function sanitizeNextPath(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback;
  }
  return raw;
}

export async function getCustomerSessionOptions(): Promise<SessionOptions> {
  return {
    cookieName: CUSTOMER_COOKIE_NAME,
    password: await derivedSessionPassword('customer'),
    ttl: 60 * 60 * 24 * 30, // 30 days: customers book occasionally, no reason to log them out often
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}
