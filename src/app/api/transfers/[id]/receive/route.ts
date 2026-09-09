import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { confirmReceipt, getTransferById } from "@/services/transfer.service";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const userId = session.user.id as string;

  if (!hasPermission(session, PERMISSIONS.TRANSFER_MANAGE)) {
    if (!hasPermission(session, PERMISSIONS.TRANSFER_RECEIVE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const transfer = await getTransferById(params.id);
    if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isDestPic = await prisma.roomPic.findFirst({
      where: { roomId: transfer.toRoomId, userId, picType: "PRIMARY", isActive: true },
    });
    if (!isDestPic) {
      return NextResponse.json(
        { error: "Only the destination room's Primary PIC can confirm receipt." },
        { status: 403 }
      );
    }
  }

  try {
    const transfer = await confirmReceipt(params.id, userId);
    return NextResponse.json({ data: transfer });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
