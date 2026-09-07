import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";

// ===== Categories =====

export async function listCategories() {
  return prisma.assetCategory.findMany({
    where: { deletedAt: null },
    include: { parentCategory: true, _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  input: { name: string; code: string; parentCategoryId?: string },
  actorUserId: string | null
) {
  const category = await prisma.assetCategory.create({ data: input });
  await recordAuditLog({
    userId: actorUserId,
    action: "category.create",
    entityType: "AssetCategory",
    entityId: category.id,
    newValue: input,
  });
  return category;
}

// ===== Models =====

export async function listModels() {
  return prisma.assetModel.findMany({
    where: { deletedAt: null },
    include: { category: true, _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createModel(
  input: { name: string; categoryId: string; brand?: string; manufacturer?: string },
  actorUserId: string | null
) {
  const model = await prisma.assetModel.create({ data: input });
  await recordAuditLog({
    userId: actorUserId,
    action: "model.create",
    entityType: "AssetModel",
    entityId: model.id,
    newValue: input,
  });
  return model;
}

// ===== Vendors =====

export async function listVendors() {
  return prisma.vendor.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createVendor(
  input: { name: string; contactPerson?: string; phone?: string; email?: string; address?: string },
  actorUserId: string | null
) {
  const vendor = await prisma.vendor.create({ data: input });
  await recordAuditLog({
    userId: actorUserId,
    action: "vendor.create",
    entityType: "Vendor",
    entityId: vendor.id,
    newValue: input,
  });
  return vendor;
}
