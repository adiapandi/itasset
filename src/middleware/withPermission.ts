import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import type { PermissionCode } from "@/lib/permissions";

/**
 * Wraps an API route handler: verifies the caller is authenticated
 * and holds the given permission before the handler body ever runs.
 * Usage:
 *   export const POST = withPermission(PERMISSIONS.USER_CREATE, async (req, session) => { ... });
 */
export function withPermission(
  code: PermissionCode,
  handler: (req: Request, session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>) => Promise<Response>
) {
  return async (req: Request) => {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!hasPermission(session, code)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      return await handler(req, session);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status });
    }
  };
}
