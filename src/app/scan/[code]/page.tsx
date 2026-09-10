import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ScanRedirectPage({ params }: { params: { code: string } }) {
  const asset = await prisma.asset.findFirst({
    where: { assetCode: params.code.toUpperCase(), deletedAt: null },
    select: { id: true },
  });

  if (!asset) notFound();

  redirect(`/assets/${asset.id}`);
}
