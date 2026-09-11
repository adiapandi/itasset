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

      {/* Everything — barcode included — is rotated -90deg together, so the
          whole label runs "upward" along the tape's length instead of
          sideways. Barcodes scan fine at any rotation, so this is safe. */}
      <style>{`
        @page {
          size: 40mm 65mm;
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto flex items-center gap-1" style={{ width: "36mm" }}>
        {/* Barcode: natural (pre-rotation) box is wide x short (55mm x 16mm)
            since that's a barcode's natural shape; object-fit:contain keeps
            it undistorted. After -90deg rotation it becomes the tall,
            narrow shape declared by the outer RotatedLabel box. */}
        <RotatedLabel boxWidth="16mm" boxHeight="55mm">
          <div style={{ width: "55mm", height: "16mm" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={barcodeDataUrl}
              alt={`Barcode for ${asset.assetCode}`}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </RotatedLabel>

        <RotatedLabel text={asset.assetCode} boxWidth="4mm" boxHeight="55mm" fontSizeMm="2.4mm" bold mono />
        <RotatedLabel text={asset.name} boxWidth="4mm" boxHeight="55mm" fontSizeMm="2.8mm" bold />
        {purchaseMonthYear && (
          <RotatedLabel text={purchaseMonthYear} boxWidth="4mm" boxHeight="55mm" fontSizeMm="2.4mm" />
        )}
      </div>
    </div>
  );
}
