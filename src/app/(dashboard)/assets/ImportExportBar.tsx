"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ImportRow {
  name: string;
  categoryCode: string;
  serialNumber?: string;
  brand?: string;
  condition?: string;
}

export function ImportExportBar() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus(null);

    try {
      const rows = await parseFile(file);
      const res = await fetch("/api/assets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const body = await res.json();

      if (!res.ok) {
        setStatus(`Import failed: ${body.error ?? "unknown error"}`);
      } else {
        const { createdCount, errors } = body.data;
        setStatus(
          `Imported ${createdCount} asset(s).` +
            (errors.length ? ` ${errors.length} row(s) skipped — check the category codes.` : "")
        );
        router.refresh();
      }
    } catch {
      setStatus("Could not read that file. Use a .csv or .xlsx exported from the same template.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleExport() {
    setBusy(true);
    try {
      const res = await fetch("/api/assets/export");
      const body = await res.json();
      const worksheet = XLSX.utils.json_to_sheet(body.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
      XLSX.writeFile(workbook, `iasset-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={handleImportClick}
        disabled={busy}
        className="rounded border border-border px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-sunken disabled:opacity-60"
      >
        Import
      </button>
      <button
        onClick={handleExport}
        disabled={busy}
        className="rounded border border-border px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-sunken disabled:opacity-60"
      >
        Export
      </button>
      {status && <span className="text-xs text-ink-soft">{status}</span>}
    </div>
  );
}

function parseFile(file: File): Promise<ImportRow[]> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(normalizeRows(result.data as Record<string, string>[])),
        error: reject,
      });
    });
  }

  return file.arrayBuffer().then((buf) => {
    const workbook = XLSX.read(buf, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
    return normalizeRows(rows);
  });
}

function normalizeRows(rows: Record<string, string>[]): ImportRow[] {
  return rows.map((r) => ({
    name: r["Name"] ?? r["name"] ?? "",
    categoryCode: r["Category Code"] ?? r["categoryCode"] ?? "",
    serialNumber: r["Serial Number"] ?? r["serialNumber"],
    brand: r["Brand"] ?? r["brand"],
    condition: r["Condition"] ?? r["condition"],
  }));
}
