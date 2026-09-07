import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listUsers } from "@/services/user.service";
import { NewUserForm } from "./NewUserForm";
import { UsersTable } from "./UsersTable";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.USER_VIEW)) {
    redirect("/dashboard");
  }

  const [users, roles, departments] = await Promise.all([
    listUsers(),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const canCreate = hasPermission(session, PERMISSIONS.USER_CREATE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Users</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage internal accounts and their roles.</p>
        </div>
      </div>

      {canCreate && (
        <div className="mt-6">
          <NewUserForm roles={roles} departments={departments} />
        </div>
      )}

      <div className="mt-6">
        <UsersTable users={users} />
      </div>
    </div>
  );
}
