import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewAssetForm } from "./NewAssetForm";

export default async function NewAssetPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_CREATE)) {
    redirect("/assets");
  }

  const [categories, vendors, departments, rooms] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.room.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-ink">Add asset</h1>
      <p className="mt-1 text-sm text-ink-soft">
        The asset code is generated automatically based on the category you choose.
      </p>

      <div className="mt-6">
        <NewAssetForm categories={categories} vendors={vendors} departments={departments} rooms={rooms} />
      </div>
    </div>
  );
}
