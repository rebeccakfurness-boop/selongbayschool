import { randomBytes, createHash } from 'crypto';
import { sql } from '@/lib/db';

export type DeviceAccountType = 'customer' | 'student';

/** 45 days — inside the school's requested 30-60 day range. Rotated on every successful use
 * (see verifyAndRotateDeviceToken), so an actively-used device effectively never expires; only
 * an abandoned one does, 45 days after its last login. */
export const DEVICE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 45;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Exposed so a page can tell, without ever sending a hash to the client, which row in a
 * device list belongs to the browser making the request right now — see listDeviceTokens. */
export function hashDeviceToken(raw: string): string {
  return hashToken(raw);
}

/** Minimal, good-enough-to-recognize-your-own-device label — not trying to be a full UA
 * database, just enough for "Chrome on iPhone" to mean something on the trusted-devices list.
 * Order matters: Edge/Opera UAs also contain "Chrome", and Chrome UAs also contain "Safari". */
export function parseDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';

  let browser = 'a browser';
  if (/Edg\//.test(userAgent)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(userAgent)) browser = 'Opera';
  else if (/CriOS/.test(userAgent)) browser = 'Chrome';
  else if (/Chrome\//.test(userAgent)) browser = 'Chrome';
  else if (/FxiOS|Firefox\//.test(userAgent)) browser = 'Firefox';
  else if (/Safari\//.test(userAgent)) browser = 'Safari';

  let os = 'an unknown device';
  if (/iPhone/.test(userAgent)) os = 'iPhone';
  else if (/iPad/.test(userAgent)) os = 'iPad';
  else if (/Android/.test(userAgent)) os = 'Android';
  else if (/Mac OS X/.test(userAgent)) os = 'Mac';
  else if (/Windows/.test(userAgent)) os = 'Windows';
  else if (/CrOS/.test(userAgent)) os = 'Chromebook';
  else if (/Linux/.test(userAgent)) os = 'Linux';

  return `${browser} on ${os}`;
}

/** Structurally matches both a Route Handler's `Request.headers` and the `ReadonlyHeaders`
 * returned by `headers()` in a Server Component — device-trust needs to work from both (issuing
 * a token happens in an API route, silently redeeming one happens on the login page itself). */
interface HeadersLike {
  get(name: string): string | null;
}

function clientIp(headers: HeadersLike): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return headers.get('x-real-ip');
}

export interface DeviceTokenRow {
  id: number;
  device_label: string | null;
  ip_address: string | null;
  first_seen_at: string;
  last_used_at: string;
  expires_at: string;
}

/** Issued right after a successful login (magic-link verify or student password login) —
 * always, since "remember this device" is automatic here, not opt-in. Returns the raw token;
 * callers set it as the httpOnly device-trust cookie and never store it themselves. */
export async function createDeviceToken(accountType: DeviceAccountType, accountId: number, headers: HeadersLike): Promise<string> {
  const raw = randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + DEVICE_TOKEN_TTL_MS);
  const label = parseDeviceLabel(headers.get('user-agent'));
  const ip = clientIp(headers);

  await sql`
    INSERT INTO device_tokens (account_type, account_id, token_hash, device_label, ip_address, expires_at)
    VALUES (${accountType}, ${accountId}, ${tokenHash}, ${label}, ${ip}, ${expiresAt.toISOString()})
  `;

  logDeviceTrustEvent('new_device_trusted', { accountType, accountId, label, ip });
  return raw;
}

/** Read-only check used by the login page to decide what to render — does NOT rotate or consume
 * the token, unlike verifyAndRotateDeviceToken. This matters: a Server Component can't set
 * cookies, so if this rotated the token on every page view, the browser's cookie would go stale
 * before the user ever got to use it. Exists specifically so the page can show "Continue as
 * [name]?" without a shared/family device silently signing someone in as whoever last used it —
 * the actual login only happens once the person confirms via the device-login route. */
export async function peekDeviceToken(accountType: DeviceAccountType, rawToken: string): Promise<{ accountId: number } | null> {
  const tokenHash = hashToken(rawToken);
  const rows = (await sql`
    SELECT account_id FROM device_tokens
    WHERE token_hash = ${tokenHash} AND account_type = ${accountType}
      AND revoked_at IS NULL AND expires_at > now()
  `) as unknown as { account_id: number }[];
  const row = rows[0];
  if (!row) return null;

  if (!(await accountStillExists(accountType, row.account_id))) return null;
  return { accountId: row.account_id };
}

/** The actual login: called once the user confirms "Continue as [name]?" (or, before that
 * confirmation step existed, would have been called straight from the login page — see
 * peekDeviceToken for why that changed). Verifies the token, confirms the account it points at
 * still exists (so a deleted customer/student_account row — the closest thing this app has to
 * "suspended" — immediately stops the token working, same as the spec asks a status change to
 * do), then rotates it: the old row is revoked and a fresh token/row takes its place. Returns
 * null for anything invalid — missing, expired, revoked, or an orphaned account — so the caller
 * falls back to the normal login form with no special-casing. */
export async function verifyAndRotateDeviceToken(
  accountType: DeviceAccountType,
  rawToken: string,
  headers: HeadersLike
): Promise<{ accountId: number; newRawToken: string } | null> {
  const tokenHash = hashToken(rawToken);

  const rows = (await sql`
    SELECT id, account_id, first_seen_at::text FROM device_tokens
    WHERE token_hash = ${tokenHash} AND account_type = ${accountType}
      AND revoked_at IS NULL AND expires_at > now()
  `) as unknown as { id: number; account_id: number; first_seen_at: string }[];
  const tokenRow = rows[0];
  if (!tokenRow) return null;

  const accountExists = await accountStillExists(accountType, tokenRow.account_id);
  if (!accountExists) {
    // Orphaned token (account deleted since) — revoke it defensively so it can't be retried.
    await sql`UPDATE device_tokens SET revoked_at = now() WHERE id = ${tokenRow.id}`;
    return null;
  }

  const newRaw = randomBytes(32).toString('hex');
  const newHash = hashToken(newRaw);
  const expiresAt = new Date(Date.now() + DEVICE_TOKEN_TTL_MS);
  const label = parseDeviceLabel(headers.get('user-agent'));
  const ip = clientIp(headers);

  await sql`UPDATE device_tokens SET revoked_at = now() WHERE id = ${tokenRow.id}`;
  await sql`
    INSERT INTO device_tokens (account_type, account_id, token_hash, device_label, ip_address, first_seen_at, expires_at)
    VALUES (${accountType}, ${tokenRow.account_id}, ${newHash}, ${label}, ${ip}, ${tokenRow.first_seen_at}::timestamptz, ${expiresAt.toISOString()})
  `;

  logDeviceTrustEvent('device_login', { accountType, accountId: tokenRow.account_id, label, ip });
  return { accountId: tokenRow.account_id, newRawToken: newRaw };
}

async function accountStillExists(accountType: DeviceAccountType, accountId: number): Promise<boolean> {
  if (accountType === 'customer') {
    const rows = await sql`SELECT id FROM customers WHERE id = ${accountId}`;
    return rows.length > 0;
  }
  const rows = await sql`SELECT id FROM student_accounts WHERE id = ${accountId}`;
  return rows.length > 0;
}

/** Explicit logout: revoke the one device this browser is carrying, so "log out" also forgets
 * the device rather than leaving it silently trusted (important on shared/school computers). */
export async function revokeDeviceToken(accountType: DeviceAccountType, rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await sql`UPDATE device_tokens SET revoked_at = now() WHERE token_hash = ${tokenHash} AND account_type = ${accountType} AND revoked_at IS NULL`;
  logDeviceTrustEvent('device_forgotten', { accountType, reason: 'logout' });
}

/** "Log out everywhere" and the email-change safeguard both go through here — every device this
 * account has ever trusted stops working immediately. */
export async function revokeAllDeviceTokensForAccount(accountType: DeviceAccountType, accountId: number): Promise<void> {
  await sql`
    UPDATE device_tokens SET revoked_at = now()
    WHERE account_type = ${accountType} AND account_id = ${accountId} AND revoked_at IS NULL
  `;
  logDeviceTrustEvent('device_forgotten', { accountType, accountId, reason: 'revoke_all' });
}

/** Revokes one specific device from the "manage trusted devices" list. Scoped to accountId so a
 * user can only ever revoke their own devices, never guess another account's token id. */
export async function revokeDeviceTokenById(accountType: DeviceAccountType, accountId: number, tokenId: number): Promise<void> {
  await sql`
    UPDATE device_tokens SET revoked_at = now()
    WHERE id = ${tokenId} AND account_type = ${accountType} AND account_id = ${accountId} AND revoked_at IS NULL
  `;
  logDeviceTrustEvent('device_forgotten', { accountType, accountId, tokenId, reason: 'manual_revoke' });
}

/** currentTokenHash (from the requesting browser's own device cookie, hashed via
 * hashDeviceToken) marks that one row is_current — the raw token itself is never returned, only
 * a boolean, so the client can label "This device" without the hash ever leaving the server. */
export async function listDeviceTokens(
  accountType: DeviceAccountType,
  accountId: number,
  currentTokenHash?: string | null
): Promise<(DeviceTokenRow & { is_current: boolean })[]> {
  const rows = (await sql`
    SELECT id, device_label, ip_address, first_seen_at::text, last_used_at::text, expires_at::text, token_hash
    FROM device_tokens
    WHERE account_type = ${accountType} AND account_id = ${accountId} AND revoked_at IS NULL AND expires_at > now()
    ORDER BY last_used_at DESC
  `) as unknown as (DeviceTokenRow & { token_hash: string })[];

  return rows.map(({ token_hash, ...row }) => ({ ...row, is_current: token_hash === currentTokenHash }));
}

/** Structured server-side log line — no email/SMS notification exists for this yet, just a
 * greppable audit trail an admin (or Rebecca, reviewing logs) can search if a parent reports
 * unexpected access to their or their child's account. */
function logDeviceTrustEvent(event: 'new_device_trusted' | 'device_login' | 'device_forgotten', details: Record<string, unknown>): void {
  console.log(`[device-trust] ${event}`, JSON.stringify(details));
}

/** Generic sliding-window rate limiter shared by every auth endpoint that needs it (device-token
 * verification, magic-link requests, student password login). Not a queue or token bucket —
 * just "at most N attempts per identifier per window" via one row in auth_rate_limits, reset
 * once the window has elapsed. Fails open (allowed: true) on a DB error so a rate-limiter outage
 * can't itself become a login outage. */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  { maxAttempts, windowSeconds }: { maxAttempts: number; windowSeconds: number }
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const rows = (await sql`
      INSERT INTO auth_rate_limits (scope, identifier, attempt_count, window_start)
      VALUES (${scope}, ${identifier}, 1, now())
      ON CONFLICT (scope, identifier) DO UPDATE SET
        attempt_count = CASE WHEN auth_rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          THEN 1 ELSE auth_rate_limits.attempt_count + 1 END,
        window_start = CASE WHEN auth_rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          THEN now() ELSE auth_rate_limits.window_start END
      RETURNING attempt_count, window_start::text
    `) as unknown as { attempt_count: number; window_start: string }[];

    const row = rows[0];
    if (row.attempt_count > maxAttempts) {
      const elapsedSeconds = (Date.now() - new Date(row.window_start).getTime()) / 1000;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(windowSeconds - elapsedSeconds)) };
    }
    return { allowed: true };
  } catch (err) {
    console.error('[device-trust] rate limit check failed, failing open', err);
    return { allowed: true };
  }
}
