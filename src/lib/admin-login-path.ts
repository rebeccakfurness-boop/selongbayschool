/** Staff have two branded entry points to the same login (see /admin/login and /teacher/login's
 * own comments) — the device-login/forget routes need to redirect back to whichever one sent
 * them here on failure, without that becoming an open redirect. Only these two paths are ever
 * valid, so an allowlist rather than sanitizeNextPath's generic same-origin check. */
const ADMIN_LOGIN_PATHS = ['/admin/login', '/teacher/login'] as const;

export function adminLoginPathFromParam(raw: string | null): string {
  return (ADMIN_LOGIN_PATHS as readonly string[]).includes(raw ?? '') ? (raw as string) : '/admin/login';
}
