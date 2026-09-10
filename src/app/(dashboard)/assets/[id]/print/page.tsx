import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAssetById } from "@/services/asset.service";
import { generateQrDataUrl, buildScanUrl } from "@/lib/qrcode";
import { PrintButton } from "./PrintButton";

export default async function AssetLabelPrintPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) redirect("/dashboard");

  const asset = await getAssetById(params.id);
  if (!asset) notFound();

  const scanUrl = buildScanUrl(asset.assetCode);
  const qrDataUrl = await generateQrDataUrl(scanUrl);

  return (
    <div>
      <div className="print:hidden mb-4">
        <PrintButton />
      </div>

      {/* This card is what actually prints — sized roughly for a small
          adhesive asset label. The dashboard sidebar/topbar are hidden via
          the print:hidden class on their wrappers in the layout. */}
      <div className="mx-auto flex w-72 flex-col items-center gap-2 rounded-md border border-border bg-surface p-4 text-center print:border-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR code for ${asset.assetCode}`} className="h-40 w-40" />
        <p className="font-mono text-sm font-semibold text-ink">{asset.assetCode}</p>
        <p className="text-sm text-ink">{asset.name}</p>
        {asset.serialNumber && <p className="text-xs text-ink-soft">S/N: {asset.serialNumber}</p>}
      </div>
    </div>
  );
}
