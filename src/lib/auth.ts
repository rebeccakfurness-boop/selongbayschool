export const ADMIN_COOKIE_NAME = 'sbs_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) {
    throw new Error('ADMIN_PASSWORD (or ADMIN_SESSION_SECRET) is not set');
  }
  return value;
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Buffer.from(signature).toString('hex');
}

export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + SESSION_TTL_MS;
  const signature = await hmac(String(expiry));
  return `${expiry}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiryStr, signature] = token.split('.');
  if (!expiryStr || !signature) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = await hmac(expiryStr);
  if (expected.length !== signature.length) return false;
  // constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export function checkAdminPassword(candidate: string): boolean {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual) return false;
  if (candidate.length !== actual.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) {
    mismatch |= candidate.charCodeAt(i) ^ actual.charCodeAt(i);
  }
  return mismatch === 0;
}
