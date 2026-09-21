import { randomBytes, randomInt } from 'crypto';
import { sql } from '@/lib/db';
import { MAGIC_LINK_TOKEN_TTL_MS } from '@/lib/auth';
import { siteConfig } from '@/lib/site-content';

/** Issues both halves of a login attempt for one customer: the long random token the email link
 * itself uses, and a short 6-digit code shown alongside it -- typed into whichever browser the
 * parent is actually using, rather than clicking through from their email app's own in-app
 * browser. The two exist because many parents' "logged in before on this device" reports turned
 * out to be the email app's mini-browser holding the session/device cookie, not their regular
 * browser -- the code sidesteps that entirely since it's typed, not clicked, so the login always
 * happens in the browser the parent is looking at. Both share one expiry and are cleared together
 * on use (see /api/account/verify and /api/account/verify-code), so using either invalidates the
 * other. */
export async function issueCustomerMagicLink(customerId: number, next: string): Promise<{ verifyUrl: string; code: string }> {
  const token = randomBytes(32).toString('hex');
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TOKEN_TTL_MS);

  await sql`
    UPDATE customers SET magic_link_token = ${token}, magic_link_code = ${code}, magic_link_token_expires_at = ${expiresAt.toISOString()}
    WHERE id = ${customerId}
  `;

  const verifyUrl = new URL('/api/account/verify', siteConfig.url);
  verifyUrl.searchParams.set('token', token);
  verifyUrl.searchParams.set('next', next);

  return { verifyUrl: verifyUrl.toString(), code };
}
