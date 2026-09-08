import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Full IA from the architecture doc. Items outside Phase 1 are shown but
// disabled, so the eventual navigation shape is visible from day one
// instead of being rebuilt piecemeal each phase.
const SECTIONS: NavSection[] = [
  { title: "", items: [{ label: "Dashboard", href: "/dashboard", enabled: true }] },
  {
    title: "Assets",
    items: [
      { label: "All Assets", href: "/assets", enabled: true },
      { label: "Categories", href: "/assets/categories", enabled: true },
      { label: "Models", href: "/assets/models", enabled: true },
      { label: "Vendors", href: "/assets/vendors", enabled: true },
    ],
  },
  {
    title: "Locations",
    items: [
      { label: "Rooms", href: "/locations/rooms", enabled: true },
      { label: "Buildings", href: "/locations/buildings", enabled: true },
    ],
  },
  {
    title: "Transfers",
    items: [
      { label: "Transfer Requests", href: "/transfers", enabled: false },
      { label: "Pending Approvals", href: "/transfers/approvals", enabled: false },
    ],
  },
  { title: "Maintenance", items: [{ label: "Maintenance", href: "/maintenance", enabled: false }] },
  { title: "Audits", items: [{ label: "Audit Sessions", href: "/audits", enabled: false }] },
  { title: "Reports", items: [{ label: "Reports", href: "/reports", enabled: false }] },
  {
    title: "Administration",
    items: [
      { label: "Users", href: "/admin/users", enabled: true },
      { label: "Roles", href: "/admin/roles", enabled: false },
      { label: "Audit Logs", href: "/admin/audit-logs", enabled: false },
    ],
  },
];

export function SidebarNav({ roles }: { roles: string[] }) {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface px-4 py-5">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-ink font-mono text-xs text-white">
          iA
        </div>
        <span className="font-semibold text-ink">iAsset</span>
      </div>

      <nav className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title || "root"}>
            {section.title && (
              <p className="px-2 mb-1 text-xs font-medium text-ink-soft">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) =>
                item.enabled ? (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded px-2 py-1.5 text-sm text-ink-soft hover:bg-accent-soft hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.href}>
                    <span className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-ink-soft/40 cursor-not-allowed">
                      {item.label}
                      <span className="text-[10px]">soon</span>
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </nav>

      <p className="mt-8 px-2 text-xs text-ink-soft/60">Signed in as {roles.join(", ") || "—"}</p>
    </aside>
  );
}
