import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAssetById } from "@/services/asset.service";
import { generateBarcodeDataUrl } from "@/lib/barcode";
import { PrintButton } from "./PrintButton";
import { RotatedLabel } from "./RotatedLabel";

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
  const purchaseMonthYear = formatMonthYear(asset.purchaseDate);

  return (
    <div>
      <div className="print:hidden mb-4 flex items-center gap-3">
        <PrintButton />
        <p className="text-xs text-ink-soft">
          Sized for a 36mm continuous label tape. In the print dialog, set scale to 100% and
          disable extra margins/headers for the closest fit.
        </p>
      </div>

      <style>{`
        @page {
          size: 90mm 36mm;
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Barcode stays in normal (unrotated) reading orientation — this is
          what keeps it scannable without turning the tape. Each text field
          is independently rotated -90deg (reads bottom-to-top) inside a
          fixed-size box, via RotatedLabel — a plain CSS transform, not
          writing-mode, so the rotation direction is unambiguous. */}
      <div className="mx-auto flex items-end gap-1.5 rounded-md border border-border bg-surface p-2 print:border-none print:p-0" style={{ height: "32mm" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={barcodeDataUrl} alt={`Barcode for ${asset.assetCode}`} style={{ height: "28mm", width: "auto" }} />

        <RotatedLabel text={asset.assetCode} boxHeight="28mm" fontSizeMm="2.2mm" bold mono />
        <RotatedLabel text={asset.name} boxHeight="28mm" fontSizeMm="2.6mm" bold />
        {purchaseMonthYear && <RotatedLabel text={purchaseMonthYear} boxHeight="28mm" fontSizeMm="2.2mm" />}
      </div>
    </div>
  );
}
