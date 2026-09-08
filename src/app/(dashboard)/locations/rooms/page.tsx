import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listRooms } from "@/services/room.service";
import { prisma } from "@/lib/prisma";
import { NewRoomForm } from "./NewRoomForm";

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ROOM_VIEW)) redirect("/dashboard");

  const [rooms, buildings, departments] = await Promise.all([
    listRooms(),
    prisma.building.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const canManage = hasPermission(session, PERMISSIONS.ROOM_MANAGE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Rooms</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every asset&apos;s physical location traces back to a room. Assign a Room PIC from a
            room&apos;s detail page.
          </p>
        </div>
        <Link href="/locations/buildings" className="text-sm text-accent hover:underline">
          Manage buildings →
        </Link>
      </div>

      {canManage && (
        <div className="mt-6">
          <NewRoomForm buildings={buildings} departments={departments} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Building</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Primary PIC</th>
              <th className="px-4 py-2 font-medium">Assets</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => {
              const primary = r.pics.find((p) => p.picType === "PRIMARY");
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/locations/rooms/${r.id}`} className="text-accent hover:underline">
                      {r.name}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-ink-soft">{r.roomCode}</span>
                  </td>
                  <td className="px-4 py-2 text-ink-soft">{r.building.name}</td>
                  <td className="px-4 py-2 text-ink-soft">{r.roomType.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-ink-soft">{primary?.user.name ?? "— unassigned —"}</td>
                  <td className="px-4 py-2 text-ink-soft">{r._count.assets}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        r.status === "ACTIVE"
                          ? "rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent"
                          : "rounded bg-danger-soft px-1.5 py-0.5 text-xs text-danger"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No rooms yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
