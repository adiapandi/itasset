import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAssetById } from "@/services/asset.service";
import { StatusBadge, ConditionBadge } from "@/components/shared/Badges";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) {
    redirect("/dashboard");
  }

  const asset = await getAssetById(params.id);
  if (!asset) notFound();

  const fields: [string, string][] = [
    ["Category", asset.category.name],
    ["Model", asset.model?.name ?? "—"],
    ["Brand", asset.brand ?? "—"],
    ["Serial number", asset.serialNumber ?? "—"],
    ["Vendor", asset.vendor?.name ?? "—"],
    ["Department", asset.department?.name ?? "—"],
    ["Purchase date", formatDate(asset.purchaseDate)],
    ["Purchase price", asset.purchasePrice ? `Rp ${asset.purchasePrice.toString()}` : "—"],
    ["Warranty end", formatDate(asset.warrantyEndDate)],
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-ink-soft">{asset.assetCode}</p>
          <h1 className="text-xl font-semibold text-ink">{asset.name}</h1>
          <div className="mt-2 flex gap-2">
            <StatusBadge status={asset.status} />
            <ConditionBadge condition={asset.condition} />
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-md border border-border bg-surface p-5 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-ink-soft">{label}</dt>
            <dd className="text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {asset.notes && (
        <div className="mt-4 rounded-md border border-border bg-surface p-5">
          <p className="text-xs text-ink-soft">Notes</p>
          <p className="mt-1 text-sm text-ink">{asset.notes}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-soft">
        Location, assignment, movement history, and QR labels arrive in Phase 3–6.
      </p>
    </div>
  );
}
