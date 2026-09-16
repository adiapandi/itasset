import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listMaintenanceRecords } from "@/services/maintenance.service";
import { MaintenanceStatusBadge } from "@/components/shared/MaintenanceStatusBadge";

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.MAINTENANCE_VIEW)) redirect("/dashboard");

  const records = await listMaintenanceRecords({});

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Maintenance</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {records.length} record(s). Schedule new maintenance from an asset&apos;s detail page.
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Start date</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-sunken">
                <td className="px-4 py-2">
                  <Link href={`/maintenance/${r.id}`} className="text-accent hover:underline">
                    {r.asset.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-ink-soft">{r.asset.assetCode}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">{r.maintenanceType}</td>
                <td className="px-4 py-2 text-ink-soft">{r.vendor?.name ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {new Date(r.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2">
                  <MaintenanceStatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No maintenance records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
