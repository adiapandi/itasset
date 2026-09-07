import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listCategories } from "@/services/catalog.service";
import { NewCategoryForm } from "./NewCategoryForm";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) redirect("/dashboard");

  const categories = await listCategories();
  const canManage = hasPermission(session, PERMISSIONS.CATEGORY_MANAGE);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Asset Categories</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Categories drive asset code prefixes and, later, approval workflow rules per category.
      </p>

      {canManage && (
        <div className="mt-6">
          <NewCategoryForm categories={categories} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Parent</th>
              <th className="px-4 py-2 font-medium">Assets</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-ink-soft">{c.code}</td>
                <td className="px-4 py-2 text-ink">{c.name}</td>
                <td className="px-4 py-2 text-ink-soft">{c.parentCategory?.name ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{c._count.assets}</td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
