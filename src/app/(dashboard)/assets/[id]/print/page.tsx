import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAssetById } from "@/services/asset.service";
import { generateBarcodeDataUrl } from "@/lib/barcode";
import { PrintButton } from "./PrintButton";

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

  // Each text field uses CSS vertical writing mode instead of a manual
  // rotate transform — it lets the browser's print engine handle the box
  // sizing correctly (a hand-rolled `transform: rotate()` on inline text
  // reserves its ORIGINAL horizontal layout space, which throws off flex
  // alignment; vertical-rl doesn't have that problem).
  const verticalTextStyle: React.CSSProperties = {
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <div className="print:hidden mb-4 flex items-center gap-3">
        <PrintButton />
        <p className="text-xs text-ink-soft">
          Sized for a 36mm continuous label tape (e.g. Brother P-touch), laid out horizontally to
          match the tape. In the print dialog, set scale to 100% and disable extra margins/headers
          for the closest fit.
        </p>
      </div>

      {/* @page here sets the tape's fixed dimension (height, 36mm) — width
          is a generous fixed guess since continuous tape length is
          auto-cut by the printer driver based on content. */}
      <style>{`
        @page {
          size: 100mm 36mm;
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto flex items-center gap-3 rounded-md border border-border bg-surface p-2 print:border-none print:p-0" style={{ height: "32mm" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={barcodeDataUrl} alt={`Barcode for ${asset.assetCode}`} style={{ height: "24mm", width: "auto" }} />
        <p className="font-mono text-[10px] font-semibold text-ink" style={verticalTextStyle}>
          {asset.assetCode}
        </p>
        <p className="text-[10px] text-ink" style={verticalTextStyle}>
          {asset.name}
        </p>
        {purchaseMonthYear && (
          <p className="text-[10px] text-ink-soft" style={verticalTextStyle}>
            {purchaseMonthYear}
          </p>
        )}
      </div>
    </div>
  );
}
