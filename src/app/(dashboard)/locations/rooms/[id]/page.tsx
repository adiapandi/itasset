import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getRoomById } from "@/services/room.service";
import { prisma } from "@/lib/prisma";
import { AssignPicForm } from "./AssignPicForm";
import { UnassignPicButton } from "./UnassignPicButton";

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ROOM_VIEW)) redirect("/dashboard");

  const room = await getRoomById(params.id);
  if (!room) notFound();

  const canManagePics = hasPermission(session, PERMISSIONS.ROOM_PIC_MANAGE);
  const users = canManagePics
    ? await prisma.user.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" } })
    : [];

  const primary = room.pics.find((p) => p.picType === "PRIMARY");
  const backups = room.pics.filter((p) => p.picType === "BACKUP");

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{room.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {room.roomCode} · {room.building.name}
            {room.floor ? ` · Floor ${room.floor}` : ""} · {room.roomType.replace(/_/g, " ")}
          </p>
        </div>
        <span
          className={
            room.status === "ACTIVE"
              ? "rounded bg-accent-soft px-2 py-1 text-xs text-accent"
              : "rounded bg-danger-soft px-2 py-1 text-xs text-danger"
          }
        >
          {room.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Room → PIC */}
        <div className="lg:col-span-1">
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="text-sm font-medium text-ink">Room PIC</p>
            <p className="mt-1 text-xs text-ink-soft">
              The Primary PIC is accountable for every asset currently in this room.
            </p>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Primary</p>
              {primary ? (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-ink">{primary.user.name}</span>
                  {canManagePics && <UnassignPicButton roomPicId={primary.id} />}
                </div>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">— unassigned —</p>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Backup</p>
              {backups.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {backups.map((b) => (
                    <li key={b.id} className="flex items-center justify-between">
                      <span className="text-sm text-ink">{b.user.name}</span>
                      {canManagePics && <UnassignPicButton roomPicId={b.id} />}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">— none —</p>
              )}
            </div>

            {canManagePics && (
              <div className="mt-4 border-t border-border pt-4">
                <AssignPicForm roomId={room.id} users={users} />
              </div>
            )}
          </div>
        </div>

        {/* PIC → Assets */}
        <div className="lg:col-span-2">
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="text-sm font-medium text-ink">
              Assets in this room ({room.assets.length})
            </p>
            <div className="mt-3 overflow-hidden rounded border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-sunken text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assets.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-ink">{a.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-ink-soft">{a.assetCode}</td>
                      <td className="px-3 py-2 text-ink-soft">{a.category.name}</td>
                      <td className="px-3 py-2 text-ink-soft">{a.status.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                  {room.assets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-ink-soft">
                        No assets currently located in this room.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              New assets can be placed in this room from the &quot;Add asset&quot; form. Moving an
              existing asset between rooms now goes through a formal transfer request with
              approval — start one from the asset&apos;s detail page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
