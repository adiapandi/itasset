import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding permissions...");
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, module: code.split(".")[0] },
    });
  }

  console.log("Seeding roles + role-permission mappings...");
  for (const [roleName, permCodes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, isSystem: true },
    });

    for (const code of permCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log("Seeding IT department...");
  const itDept = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: { name: "Information Technology", code: "IT" },
  });

  console.log("Seeding sample asset categories...");
  const sampleCategories = [
    { name: "Laptop", code: "LPT" },
    { name: "Desktop", code: "DSK" },
    { name: "Monitor", code: "MON" },
    { name: "Printer", code: "PRN" },
    { name: "Network Device", code: "NET" },
    { name: "Server", code: "SRV" },
    { name: "Mobile Device", code: "MBL" },
    { name: "UPS", code: "UPS" },
    { name: "CCTV", code: "CCT" },
  ];
  for (const cat of sampleCategories) {
    await prisma.assetCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  console.log("Seeding Super Admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@iasset.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });

  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: adminEmail,
        passwordHash,
        departmentId: itDept.id,
        roles: { create: [{ roleId: superAdminRole.id }] },
      },
    });
    console.log(`Created Super Admin: ${adminEmail} / ${adminPassword} — change this password after first login.`);
  } else {
    console.log("Super Admin already exists, skipping.");
  }

  console.log("Seeding sample building & rooms...");
  const hqBuilding = await prisma.building.upsert({
    where: { code: "HQ" },
    update: {},
    create: { name: "HQ Tower", code: "HQ" },
  });

  const serverRoom = await prisma.room.upsert({
    where: { roomCode: "SRV-01" },
    update: {},
    create: {
      roomCode: "SRV-01",
      name: "IT Server Room",
      buildingId: hqBuilding.id,
      floor: "1",
      departmentId: itDept.id,
      roomType: "SERVER_ROOM",
    },
  });

  await prisma.room.upsert({
    where: { roomCode: "OFC-IT" },
    update: {},
    create: {
      roomCode: "OFC-IT",
      name: "IT Office",
      buildingId: hqBuilding.id,
      floor: "2",
      departmentId: itDept.id,
      roomType: "OFFICE",
    },
  });

  const existingPrimaryPic = await prisma.roomPic.findFirst({
    where: { roomId: serverRoom.id, picType: "PRIMARY", isActive: true },
  });
  if (!existingPrimaryPic) {
    await prisma.roomPic.create({
      data: { roomId: serverRoom.id, userId: adminUser.id, picType: "PRIMARY", isActive: true },
    });
  }

  console.log("Seeding approval workflow rules...");
  const itManagerRole = await prisma.role.findUniqueOrThrow({ where: { name: "IT Manager" } });
  const categoryByCode = new Map(
    (await prisma.assetCategory.findMany()).map((c) => [c.code, c])
  );

  // Re-seeded idempotently: clear then recreate, since this is fixture
  // config data (not user history) and safe to reset on every seed run.
  async function setCategoryRules(
    categoryId: string | null,
    rules: { stepOrder: number; approverType: "ROOM_PIC_SOURCE" | "ROOM_PIC_DEST" | "ROLE"; roleId?: string }[]
  ) {
    await prisma.approvalWorkflowRule.deleteMany({ where: { categoryId } });
    await prisma.approvalWorkflowRule.createMany({
      data: rules.map((r) => ({ categoryId, ...r })),
    });
  }

  // Monitor: source room PIC → destination room PIC (per architecture doc example).
  await setCategoryRules(categoryByCode.get("MON")!.id, [
    { stepOrder: 1, approverType: "ROOM_PIC_SOURCE" },
    { stepOrder: 2, approverType: "ROOM_PIC_DEST" },
  ]);

  // Laptop: source room PIC → IT Manager → destination room PIC.
  await setCategoryRules(categoryByCode.get("LPT")!.id, [
    { stepOrder: 1, approverType: "ROOM_PIC_SOURCE" },
    { stepOrder: 2, approverType: "ROLE", roleId: itManagerRole.id },
    { stepOrder: 3, approverType: "ROOM_PIC_DEST" },
  ]);

  // Server: IT Manager → destination room PIC. (The architecture doc's
  // example also has a separate "Infrastructure Manager" step — simplified
  // to IT Manager here since that's the only manager-tier role seeded so
  // far; add a dedicated role + rule later if you split the responsibility.)
  await setCategoryRules(categoryByCode.get("SRV")!.id, [
    { stepOrder: 1, approverType: "ROLE", roleId: itManagerRole.id },
    { stepOrder: 2, approverType: "ROOM_PIC_DEST" },
  ]);

  // Fallback for every other category: destination room PIC only.
  await setCategoryRules(null, [{ stepOrder: 1, approverType: "ROOM_PIC_DEST" }]);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
