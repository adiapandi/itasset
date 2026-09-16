import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewAuditSessionForm } from "./NewAuditSessionForm";

export default async function NewAuditPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.AUDIT_MANAGE)) redirect("/dashboard");

  const rooms = await prisma.room.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { assets: { where: { deletedAt: null } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-ink">Start audit</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Every asset currently in the chosen room is snapshotted as &quot;expected&quot; the moment
        you start — scan what you actually find against that list.
      </p>

      <div className="mt-6">
        <NewAuditSessionForm rooms={rooms} />
      </div>
    </div>
  );
}
