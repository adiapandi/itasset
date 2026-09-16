"use client";

import { useState } from "react";
import { RotatedLabel } from "./RotatedLabel";
import { PrintButton } from "./PrintButton";

/**
 * Per-tape-width layout presets. Every dimension scales with the tape so
 * the same composition fits whichever printer/tape is loaded — the 24mm
 * values are roughly the 36mm ones at ~0.7x, then nudged so the barcode
 * keeps enough bar height to stay reliably scannable.
 *
 * "across" = the tape's fixed width (barcode box + text columns must fit
 * inside it). "along" = length down the tape, which is continuous, so
 * there's more freedom there.
 */
const TAPE_PRESETS = {
  "36": {
    label: "36mm",
    pageWidth: "40mm",
    pageHeight: "65mm",
    along: "55mm",
    barcodeAcross: "16mm",
    codeAcross: "5mm",
    codeFont: "3.4mm",
    nameAcross: "5.5mm",
    nameFont: "4mm",
    dateAcross: "5mm",
    dateFont: "3.4mm",
  },
  "24": {
    label: "24mm",
    pageWidth: "28mm",
    pageHeight: "55mm",
    along: "45mm",
    barcodeAcross: "10mm",
    codeAcross: "3.6mm",
    codeFont: "2.4mm",
    nameAcross: "4mm",
    nameFont: "2.9mm",
    dateAcross: "3.6mm",
    dateFont: "2.4mm",
  },
} as const;

type TapeWidth = keyof typeof TAPE_PRESETS;

export function LabelPreview({
  barcodeDataUrl,
  assetCode,
  assetName,
  purchaseMonthYear,
}: {
  barcodeDataUrl: string;
  assetCode: string;
  assetName: string;
  purchaseMonthYear: string | null;
}) {
  const [tape, setTape] = useState<TapeWidth>("36");
  const preset = TAPE_PRESETS[tape];

  return (
    <div>
      <div className="print:hidden mb-4 flex flex-wrap items-center gap-3">
        <PrintButton />

        <div className="flex items-center gap-2">
          <label htmlFor="tape-size" className="text-sm text-ink">
            Tape size
          </label>
          <select
            id="tape-size"
            value={tape}
            onChange={(e) => setTape(e.target.value as TapeWidth)}
            className="rounded border border-border px-2 py-1.5 text-sm"
          >
            {(Object.keys(TAPE_PRESETS) as TapeWidth[]).map((w) => (
              <option key={w} value={w}>
                {TAPE_PRESETS[w].label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-ink-soft">
          Pick the tape loaded in the printer you&apos;ll send this to. In the print dialog: open
          &quot;More settings&quot;, set Paper size to match the tape (not A4/Letter), Margins to
          None, and Scale to 100%.
        </p>
      </div>

      {/* @page has to be re-declared whenever the tape changes, so it lives
          here in the client component rather than the server page. */}
      <style>{`
        @page {
          size: ${preset.pageWidth} ${preset.pageHeight};
          margin: 2mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Dashed frame shows the tape's real boundary on screen only — it's
          print:hidden, so it never reaches the tape. */}
      <div
        className="mx-auto rounded border border-dashed border-border bg-surface p-2 print:border-0 print:bg-transparent print:p-0"
        style={{ width: preset.pageWidth }}
      >
        <p className="print:hidden mb-1 text-center text-[8px] uppercase tracking-wide text-ink-soft">
          {preset.label} tape
        </p>

        <div className="flex items-center justify-center gap-1" style={{ height: preset.pageHeight }}>
          {/* The barcode's natural shape is wide-and-short, so its
              pre-rotation box is (along x across); after -90deg it becomes
              the tall, narrow column the outer box declares. */}
          <RotatedLabel boxWidth={preset.barcodeAcross} boxHeight={preset.along}>
            <div style={{ width: preset.along, height: preset.barcodeAcross }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={barcodeDataUrl}
                alt={`Barcode for ${assetCode}`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </RotatedLabel>

          <RotatedLabel
            text={assetCode}
            boxWidth={preset.codeAcross}
            boxHeight={preset.along}
            fontSizeMm={preset.codeFont}
            bold
            mono
          />
          <RotatedLabel
            text={assetName}
            boxWidth={preset.nameAcross}
            boxHeight={preset.along}
            fontSizeMm={preset.nameFont}
            bold
          />
          {purchaseMonthYear && (
            <RotatedLabel
              text={purchaseMonthYear}
              boxWidth={preset.dateAcross}
              boxHeight={preset.along}
              fontSizeMm={preset.dateFont}
            />
          )}
        </div>
      </div>
    </div>
  );
}
