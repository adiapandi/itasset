import { NextResponse } from "next/server";
import { withPermission } from "@/middleware/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { createUserSchema } from "@/validators/user.validator";
import { createUser, listUsers } from "@/services/user.service";

export const GET = withPermission(PERMISSIONS.USER_VIEW, async () => {
  const users = await listUsers();
  return NextResponse.json({ data: users });
});

export const POST = withPermission(PERMISSIONS.USER_CREATE, async (req, session) => {
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const user = await createUser(parsed.data, session.user.id as string);
  return NextResponse.json({ data: user }, { status: 201 });
});
