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
  return new Date(d).toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" }).replace("/", " / ");
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
          Sized for a 36mm continuous label tape (e.g. Brother P-touch). In the print dialog, set
          scale to 100% and disable extra margins/headers for the closest fit.
        </p>
      </div>

      {/* @page below sets the printed page to 36mm wide — this is the piece
          that tells the browser's print dialog the label width. Height is
          left generous since continuous tape auto-cuts to content; trim any
          leftover blank tape via your printer driver's settings if needed. */}
      <style>{`
        @page {
          size: 36mm 70mm;
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto flex w-[32mm] flex-col items-center gap-1 rounded-md border border-border bg-surface p-2 text-center print:w-[32mm] print:border-none print:p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={barcodeDataUrl} alt={`Barcode for ${asset.assetCode}`} className="w-full" />
        <p className="font-mono text-[10px] font-semibold text-ink leading-tight">{asset.assetCode}</p>
        <p className="text-[10px] text-ink leading-tight break-words">{asset.name}</p>
        {purchaseMonthYear && (
          <p className="text-[9px] text-ink-soft leading-tight">
            <span className="font-medium">MM/YYYY</span> {purchaseMonthYear}
          </p>
        )}
      </div>
    </div>
  );
}
