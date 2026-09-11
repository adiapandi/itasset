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

  return (
    <div>
      <div className="print:hidden mb-4 flex items-center gap-3">
        <PrintButton />
        <p className="text-xs text-ink-soft">
          Sized for a 36mm-wide continuous label tape. In the print dialog, set scale to 100% and
          disable extra margins/headers for the closest fit.
        </p>
      </div>

      {/* Standard, non-rotated vertical label: 36mm wide, height grows with
          content. No CSS rotation trickery — everything reads normally
          top-to-bottom, the way almost every barcode label is designed.
          The tape's own feed/orientation on your printer is what determines
          how it looks once applied, not this markup. */}
      <style>{`
        @page {
          size: 36mm 40mm;
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto flex w-[32mm] flex-col items-center gap-1 rounded-md border border-border bg-surface p-2 text-center print:w-[32mm] print:border-none print:p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={barcodeDataUrl} alt={`Barcode for ${asset.assetCode}`} className="w-full" />
        <p className="font-mono text-[9px] font-semibold text-ink leading-tight">{asset.assetCode}</p>
        <p className="text-[9px] text-ink leading-tight break-words">{asset.name}</p>
        {purchaseMonthYear && <p className="text-[9px] text-ink-soft leading-tight">{purchaseMonthYear}</p>}
      </div>
    </div>
  );
}
