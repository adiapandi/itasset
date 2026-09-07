import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listVendors } from "@/services/catalog.service";
import { NewVendorForm } from "./NewVendorForm";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) redirect("/dashboard");

  const vendors = await listVendors();
  const canManage = hasPermission(session, PERMISSIONS.VENDOR_MANAGE);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Vendors</h1>
      <p className="mt-1 text-sm text-ink-soft">Suppliers and service providers assets can be linked to.</p>

      {canManage && (
        <div className="mt-6">
          <NewVendorForm />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Contact person</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Assets</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-ink">{v.name}</td>
                <td className="px-4 py-2 text-ink-soft">{v.contactPerson ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{v.phone ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{v.email ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{v._count.assets}</td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No vendors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
