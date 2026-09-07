import { prisma } from "@/lib/prisma";

/**
 * Generates codes like AST-IT-000123: AST fixed, category.code as segment,
 * then a zero-padded sequence scoped to that category. Uniqueness is still
 * guaranteed even if this ever raced or drifted, because assetCode itself
 * is a unique DB column — this only has to be *unlikely* to collide.
 */
export async function generateAssetCode(categoryCode: string): Promise<string> {
  const count = await prisma.asset.count({
    where: { category: { code: categoryCode } },
  });
  const sequence = String(count + 1).padStart(6, "0");
  return `AST-${categoryCode.toUpperCase()}-${sequence}`;
}
