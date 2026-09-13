import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email) {
    throw new Error("SEED_ADMIN_EMAIL is not set. Refusing to seed a production admin without it.");
  }
  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD is not set. Refusing to seed a production admin without it.");
  }
  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const agency = await prisma.agency.upsert({
    where: { id: "agency-primary" },
    update: {},
    create: {
      id: "agency-primary",
      name: "Admin",
      slug: "admin",
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: {
      name: "Admin",
      email: normalizedEmail,
      passwordHash,
      role: Role.agency_admin,
      agencyId: agency.id,
    },
  });

  console.log(`Production admin ready: ${normalizedEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
