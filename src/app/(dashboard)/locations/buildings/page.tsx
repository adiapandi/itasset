import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listBuildings } from "@/services/room.service";
import { NewBuildingForm } from "./NewBuildingForm";

export default async function BuildingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ROOM_VIEW)) redirect("/dashboard");

  const buildings = await listBuildings();
  const canManage = hasPermission(session, PERMISSIONS.ROOM_MANAGE);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Buildings</h1>
      <p className="mt-1 text-sm text-ink-soft">Physical buildings that contain rooms.</p>

      {canManage && (
        <div className="mt-6">
          <NewBuildingForm />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Address</th>
              <th className="px-4 py-2 font-medium">Rooms</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-ink">{b.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-soft">{b.code}</td>
                <td className="px-4 py-2 text-ink-soft">{b.address ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{b._count.rooms}</td>
              </tr>
            ))}
            {buildings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No buildings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
