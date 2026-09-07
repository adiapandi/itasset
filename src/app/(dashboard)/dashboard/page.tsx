import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [total, byStatus, recent] = await Promise.all([
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.asset.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true },
    }),
  ]);

  const statusCount = (status: string) => byStatus.find((s) => s.status === status)?._count._all ?? 0;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Phase 2 adds the asset catalog. Room, transfer, and warranty widgets arrive in later phases.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total assets" value={total} />
        <StatCard label="Available" value={statusCount("AVAILABLE")} />
        <StatCard label="Assigned" value={statusCount("ASSIGNED")} />
        <StatCard label="Under maintenance" value={statusCount("UNDER_MAINTENANCE")} />
      </div>

      <div className="mt-6 rounded-md border border-border bg-surface p-4">
        <p className="text-sm text-ink-soft">Recently added assets</p>
        <ul className="mt-2 divide-y divide-border">
          {recent.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{a.name}</span>
              <span className="font-mono text-xs text-ink-soft">{a.assetCode}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="py-2 text-sm text-ink-soft">No assets yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
