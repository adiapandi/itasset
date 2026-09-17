import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

const REPORTS = [
  { href: "/reports/inventory", title: "Asset Inventory", description: "Every asset on record, with status, condition, room, and assignment." },
  { href: "/reports/by-department", title: "Assets by Department", description: "Grouped counts and lists per department." },
  { href: "/reports/by-room", title: "Assets by Room", description: "Grouped counts and lists per room." },
  { href: "/reports/warranty", title: "Warranty", description: "Expired, expiring soon (90 days), and active warranties." },
  { href: "/reports/transfers", title: "Transfer History", description: "Room-to-room transfer requests, with date range filtering." },
  { href: "/reports/maintenance", title: "Maintenance History", description: "Maintenance records, with date range filtering." },
  { href: "/reports/status", title: "Lost / Damaged / Retired", description: "Assets currently in a non-normal status." },
  { href: "/reports/audits", title: "Audit Summary", description: "Every audit session and its verified/missing/damaged counts." },
];

export default async function ReportsIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Reports</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Every report can be exported to CSV or Excel, or printed / saved as PDF from the browser.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-md border border-border bg-surface p-4 hover:border-accent hover:bg-accent-soft"
          >
            <p className="text-sm font-medium text-ink">{r.title}</p>
            <p className="mt-1 text-xs text-ink-soft">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
