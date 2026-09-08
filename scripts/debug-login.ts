import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Usage: npx tsx scripts/debug-login.ts <email> <password>");
    process.exit(1);
  }

  console.log(`Looking up email (lowercased): "${email.toLowerCase()}"`);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.log("❌ NO USER FOUND with that email. Listing all users in DB instead:");
    const all = await prisma.user.findMany({ select: { email: true, isActive: true, deletedAt: true } });
    console.table(all);
    process.exit(0);
  }

  console.log("✅ User found:");
  console.log({ id: user.id, email: user.email, isActive: user.isActive, deletedAt: user.deletedAt });
  console.log(`passwordHash in DB: ${user.passwordHash}`);

  const matches = await bcrypt.compare(password, user.passwordHash);
  console.log(matches ? "✅ Password MATCHES the hash." : "❌ Password does NOT match the hash.");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
