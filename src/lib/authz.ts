import type { Session } from "next-auth";
import type { PermissionCode } from "./permissions";

/**
 * Session user shape carries a flattened list of permission codes
 * (computed once at sign-in / session callback — see lib/auth.ts) so
 * we never have to hit the DB on every permission check.
 */
export function hasPermission(session: Session | null, code: PermissionCode): boolean {
  if (!session?.user) return false;
  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  return perms.includes(code);
}

export function hasAnyRole(session: Session | null, roleNames: string[]): boolean {
  if (!session?.user) return false;
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  return roles.some((r) => roleNames.includes(r));
}

/** Throws-style guard for use inside API route handlers. */
export function assertPermission(session: Session | null, code: PermissionCode) {
  if (!hasPermission(session, code)) {
    const err = new Error(`Forbidden: missing permission "${code}"`);
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}
