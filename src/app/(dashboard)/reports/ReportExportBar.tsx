"use client";

/**
 * Takes already-flattened rows (Record<string,string>[], one shape per
 * report) and offers CSV/XLSX export + print. No PDF export — "Print" to
 * the browser's Save as PDF is the pragmatic equivalent without pulling in
 * a PDF-generation library for what the browser already does natively.
 */
export function ReportExportBar({ rows, filenameBase }: { rows: Record<string, string>[]; filenameBase: string }) {
  async function exportCsv() {
    const Papa = (await import("papaparse")).default;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filenameBase}.csv`);
  }

  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="print:hidden flex gap-2">
      <button
        onClick={exportCsv}
        disabled={rows.length === 0}
        className="rounded border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface-sunken disabled:opacity-50"
      >
        Export CSV
      </button>
      <button
        onClick={exportXlsx}
        disabled={rows.length === 0}
        className="rounded border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface-sunken disabled:opacity-50"
      >
        Export Excel
      </button>
      <button
        onClick={() => window.print()}
        className="rounded border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface-sunken"
      >
        Print / Save PDF
      </button>
    </div>
  );
}
