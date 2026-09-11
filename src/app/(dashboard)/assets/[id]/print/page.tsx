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
          Sized for a 36mm continuous label tape. In the print dialog: open &quot;More settings&quot;,
          set Paper size to match your tape (not A4/Letter), Margins to None, and Scale to 100%.
        </p>
      </div>

      {/* Barcode stays normal (unrotated) orientation — scannable without
          turning the tape. Each text field is rotated -90deg (reads
          bottom-to-top) via RotatedLabel, matching the physical label. */}
      <style>{`
        @page {
          size: 80mm 36mm;
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto flex items-end gap-1.5 rounded-md border border-border bg-surface p-2 print:border-none print:p-0" style={{ height: "32mm" }}>
        {/* Bounding box + object-fit:contain instead of height-only sizing —
            a long asset code (more bars) no longer blows up the barcode's
            width; it always fits within this box, proportions preserved. */}
        <div style={{ width: "45mm", height: "26mm", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={barcodeDataUrl}
            alt={`Barcode for ${asset.assetCode}`}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <RotatedLabel text={asset.assetCode} boxHeight="26mm" fontSizeMm="2.2mm" bold mono />
        <RotatedLabel text={asset.name} boxHeight="26mm" fontSizeMm="2.6mm" bold />
        {purchaseMonthYear && <RotatedLabel text={purchaseMonthYear} boxHeight="26mm" fontSizeMm="2.2mm" />}
      </div>
    </div>
  );
}
