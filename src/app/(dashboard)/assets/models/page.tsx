import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listModels, listCategories } from "@/services/catalog.service";
import { NewModelForm } from "./NewModelForm";

export default async function ModelsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) redirect("/dashboard");

  const [models, categories] = await Promise.all([listModels(), listCategories()]);
  const canManage = hasPermission(session, PERMISSIONS.MODEL_MANAGE);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Asset Models</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Models sit under a category and describe a specific product line, e.g. &quot;Latitude 5440&quot; under Laptop.
      </p>

      {canManage && (
        <div className="mt-6">
          <NewModelForm categories={categories} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Brand</th>
              <th className="px-4 py-2 font-medium">Manufacturer</th>
              <th className="px-4 py-2 font-medium">Assets</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-ink">{m.name}</td>
                <td className="px-4 py-2 text-ink-soft">{m.category.name}</td>
                <td className="px-4 py-2 text-ink-soft">{m.brand ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{m.manufacturer ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{m._count.assets}</td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No models yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
