import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAssetById } from "@/services/asset.service";
import { generateBarcodeDataUrl } from "@/lib/barcode";
import { LabelPreview } from "./LabelPreview";

function formatMonthYear(d: Date | null) {
  if (!d) return null;
  const date = new Date(d);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${mm} / ${date.getFullYear()}`;
}

export default async function AssetLabelPrintPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) redirect("/dashboard");

  const asset = await getAssetById(params.id);
  if (!asset) notFound();

  const barcodeDataUrl = await generateBarcodeDataUrl(asset.assetCode);

  // Layout, tape-size selection, and the @page rule all live in
  // LabelPreview (a client component) since the chosen tape width has to
  // drive them reactively.
  return (
    <LabelPreview
      barcodeDataUrl={barcodeDataUrl}
      assetCode={asset.assetCode}
      assetName={asset.name}
      purchaseMonthYear={formatMonthYear(asset.purchaseDate)}
    />
  );
}
