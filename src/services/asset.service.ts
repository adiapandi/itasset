import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";
import { generateAssetCode } from "./asset-code.service";
import type { AssetCondition, AssetStatus, Prisma } from "@prisma/client";

export interface AssetFilters {
  search?: string;
  status?: AssetStatus;
  categoryId?: string;
  departmentId?: string;
  condition?: AssetCondition;
  page?: number;
  pageSize?: number;
}

export interface CreateAssetInput {
  name: string;
  categoryId: string;
  modelId?: string;
  brand?: string;
  serialNumber?: string;
  vendorId?: string;
  departmentId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  condition?: AssetCondition;
  notes?: string;
}

export type UpdateAssetInput = Partial<CreateAssetInput> & {
  status?: AssetStatus;
};

export async function listAssets(filters: AssetFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where: Prisma.AssetWhereInput = {
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.condition ? { condition: filters.condition } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { assetCode: { contains: filters.search, mode: "insensitive" } },
            { serialNumber: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: true, model: true, vendor: true, department: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAssetById(id: string) {
  return prisma.asset.findFirst({
    where: { id, deletedAt: null },
    include: { category: true, model: true, vendor: true, department: true },
  });
}

export async function createAsset(input: CreateAssetInput, actorUserId: string | null) {
  const category = await prisma.assetCategory.findUniqueOrThrow({ where: { id: input.categoryId } });
  const assetCode = await generateAssetCode(category.code);

  const asset = await prisma.asset.create({
    data: {
      assetCode,
      name: input.name,
      categoryId: input.categoryId,
      modelId: input.modelId,
      brand: input.brand,
      serialNumber: input.serialNumber,
      vendorId: input.vendorId,
      departmentId: input.departmentId,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchasePrice: input.purchasePrice,
      warrantyStartDate: input.warrantyStartDate ? new Date(input.warrantyStartDate) : undefined,
      warrantyEndDate: input.warrantyEndDate ? new Date(input.warrantyEndDate) : undefined,
      condition: input.condition ?? "GOOD",
      notes: input.notes,
      createdBy: actorUserId ?? undefined,
      qrCodeValue: assetCode, // QR payload = asset code for Phase 2; Phase 6 adds real QR image generation
    },
    include: { category: true, model: true, vendor: true, department: true },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "asset.create",
    entityType: "Asset",
    entityId: asset.id,
    newValue: { assetCode: asset.assetCode, name: asset.name, status: asset.status },
  });

  return asset;
}

export async function updateAsset(id: string, input: UpdateAssetInput, actorUserId: string | null) {
  const before = await prisma.asset.findUniqueOrThrow({ where: { id } });

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: input.name,
      categoryId: input.categoryId,
      modelId: input.modelId,
      brand: input.brand,
      serialNumber: input.serialNumber,
      vendorId: input.vendorId,
      departmentId: input.departmentId,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchasePrice: input.purchasePrice,
      warrantyStartDate: input.warrantyStartDate ? new Date(input.warrantyStartDate) : undefined,
      warrantyEndDate: input.warrantyEndDate ? new Date(input.warrantyEndDate) : undefined,
      condition: input.condition,
      status: input.status,
      notes: input.notes,
    },
    include: { category: true, model: true, vendor: true, department: true },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "asset.update",
    entityType: "Asset",
    entityId: id,
    oldValue: { name: before.name, status: before.status, condition: before.condition },
    newValue: { name: asset.name, status: asset.status, condition: asset.condition },
  });

  return asset;
}

/** Soft delete only — asset history must never be permanently destroyed. */
export async function deleteAsset(id: string, actorUserId: string | null) {
  const asset = await prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "asset.delete",
    entityType: "Asset",
    entityId: id,
  });

  return asset;
}

export interface AssetImportRow {
  name: string;
  categoryCode: string;
  serialNumber?: string;
  brand?: string;
  condition?: string;
}

export interface ImportResult {
  createdCount: number;
  errors: { row: number; message: string }[];
}

/**
 * Bulk import from parsed CSV/Excel rows (parsing itself happens in the
 * API route / a client-side lib like papaparse — this only handles
 * validated rows so the service stays testable without file I/O).
 */
export async function importAssets(rows: AssetImportRow[], actorUserId: string | null): Promise<ImportResult> {
  const errors: ImportResult["errors"] = [];
  let createdCount = 0;

  const categories = await prisma.assetCategory.findMany();
  const categoryByCode = new Map(categories.map((c) => [c.code.toUpperCase(), c]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const category = categoryByCode.get(row.categoryCode?.toUpperCase());

    if (!row.name || !category) {
      errors.push({ row: i + 1, message: !category ? `Unknown category code "${row.categoryCode}"` : "Missing name" });
      continue;
    }

    try {
      await createAsset(
        {
          name: row.name,
          categoryId: category.id,
          serialNumber: row.serialNumber,
          brand: row.brand,
          condition: (row.condition?.toUpperCase() as AssetCondition) ?? "GOOD",
        },
        actorUserId
      );
      createdCount++;
    } catch (e) {
      errors.push({ row: i + 1, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  return { createdCount, errors };
}

export async function exportAssetsFlat() {
  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    include: { category: true, model: true, vendor: true, department: true },
    orderBy: { assetCode: "asc" },
  });

  return assets.map((a) => ({
    "Asset Code": a.assetCode,
    Name: a.name,
    Category: a.category.name,
    Model: a.model?.name ?? "",
    Brand: a.brand ?? "",
    "Serial Number": a.serialNumber ?? "",
    Vendor: a.vendor?.name ?? "",
    Department: a.department?.name ?? "",
    Status: a.status,
    Condition: a.condition,
    "Purchase Date": a.purchaseDate?.toISOString().slice(0, 10) ?? "",
    "Warranty End": a.warrantyEndDate?.toISOString().slice(0, 10) ?? "",
  }));
}
