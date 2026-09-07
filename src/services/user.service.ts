import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  employeeId?: string;
  departmentId?: string;
  roleIds: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  employeeId?: string;
  departmentId?: string | null;
  isActive?: boolean;
  roleIds?: string[];
}

export async function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    include: { department: true, roles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { department: true, roles: { include: { role: true } } },
  });
}

export async function createUser(input: CreateUserInput, actorUserId: string | null) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      employeeId: input.employeeId,
      departmentId: input.departmentId,
      roles: {
        create: input.roleIds.map((roleId) => ({ role: { connect: { id: roleId } } })),
      },
    },
    include: { roles: { include: { role: true } } },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    newValue: { name: user.name, email: user.email, roles: input.roleIds },
  });

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput, actorUserId: string | null) {
  const before = await prisma.user.findUniqueOrThrow({ where: { id } });

  const user = await prisma.$transaction(async (tx) => {
    if (input.roleIds) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: input.roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    }

    return tx.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email?.toLowerCase(),
        employeeId: input.employeeId,
        departmentId: input.departmentId,
        isActive: input.isActive,
      },
      include: { roles: { include: { role: true } } },
    });
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "user.update",
    entityType: "User",
    entityId: id,
    oldValue: { name: before.name, email: before.email, isActive: before.isActive },
    newValue: { name: user.name, email: user.email, isActive: user.isActive },
  });

  return user;
}

/** Soft delete only — per business rule, user/asset records are never hard-deleted. */
export async function deactivateUser(id: string, actorUserId: string | null) {
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "user.deactivate",
    entityType: "User",
    entityId: id,
  });

  return user;
}
