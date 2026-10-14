import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password || password.length < 16) {
    throw new Error("Set ADMIN_BOOTSTRAP_EMAIL and a 16+ character ADMIN_BOOTSTRAP_PASSWORD before seeding.");
  }
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new Error("No account exists for ADMIN_BOOTSTRAP_EMAIL. Sign up with this email first, then run the seed command.");
  }
  const account = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must match the password used to create the configured account.");
  }
  await db.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`Administrator role enabled for ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Admin bootstrap failed.", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
