import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getMaintenanceById } from "@/services/maintenance.service";
import { MaintenanceStatusBadge } from "@/components/shared/MaintenanceStatusBadge";
import { MaintenanceActions } from "./MaintenanceActions";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function MaintenanceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.MAINTENANCE_VIEW)) redirect("/dashboard");

  const record = await getMaintenanceById(params.id);
  if (!record) notFound();

  const canManage = hasPermission(session, PERMISSIONS.MAINTENANCE_MANAGE);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-soft">Maintenance record</p>
          <h1 className="text-xl font-semibold text-ink">{record.maintenanceType}</h1>
          <Link href={`/assets/${record.asset.id}`} className="text-sm text-accent hover:underline">
            {record.asset.name} <span className="font-mono text-xs text-ink-soft">{record.asset.assetCode}</span>
          </Link>
        </div>
        <MaintenanceStatusBadge status={record.status} />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-md border border-border bg-surface p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-ink-soft">Vendor / Technician</dt>
          <dd className="text-sm text-ink">{record.vendor?.name ?? record.technicianName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Start date</dt>
          <dd className="text-sm text-ink">{formatDate(record.startDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">End date</dt>
          <dd className="text-sm text-ink">{formatDate(record.endDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Cost</dt>
          <dd className="text-sm text-ink">{record.cost ? `Rp ${record.cost.toString()}` : "—"}</dd>
        </div>
        {record.problemDescription && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">Problem description</dt>
            <dd className="text-sm text-ink">{record.problemDescription}</dd>
          </div>
        )}
        {record.actionTaken && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">Action taken</dt>
            <dd className="text-sm text-ink">{record.actionTaken}</dd>
          </div>
        )}
        {record.result && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">Result</dt>
            <dd className="text-sm text-ink">
              {record.result} {record.warrantyClaim && "· Warranty claim used"}
            </dd>
          </div>
        )}
        {record.notes && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">Notes</dt>
            <dd className="whitespace-pre-line text-sm text-ink">{record.notes}</dd>
          </div>
        )}
      </dl>

      {canManage && (record.status === "SCHEDULED" || record.status === "IN_PROGRESS") && (
        <div className="mt-4 rounded-md border border-border bg-surface p-5">
          <p className="text-sm font-medium text-ink">Actions</p>
          <div className="mt-3">
            <MaintenanceActions recordId={record.id} status={record.status} />
          </div>
        </div>
      )}
    </div>
  );
}
