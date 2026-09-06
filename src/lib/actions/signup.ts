"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return base || "agency";
}

export async function signupAgency(formData: FormData) {
  const agencyName = String(formData.get("agencyName") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!agencyName || !adminName || !email || !password) {
    throw new Error("All fields are required.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const baseSlug = slugify(agencyName);
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.agency.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: { name: agencyName, slug, subscriptionStatus: "incomplete" },
    });
    await tx.user.create({
      data: {
        name: adminName,
        email,
        passwordHash,
        role: "agency_admin",
        agencyId: agency.id,
      },
    });
  });
}
