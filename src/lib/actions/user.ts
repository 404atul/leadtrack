"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";

export async function updateClientUser(userId: string, formData: FormData) {
  const session = await requireAgencyAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) {
    throw new Error("Name is required.");
  }

  const data: { name: string; passwordHash?: string } = { name };

  if (password) {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const { count } = await prisma.user.updateMany({
    where: { id: userId, agencyId: session.user.agencyId!, role: "client_user" },
    data,
  });
  if (count === 0) {
    throw new Error("User not found.");
  }

  revalidatePath("/admin/users");
}

export async function setClientUserActive(userId: string, isActive: boolean) {
  const session = await requireAgencyAdmin();

  const { count } = await prisma.user.updateMany({
    where: { id: userId, agencyId: session.user.agencyId!, role: "client_user" },
    data: { isActive },
  });
  if (count === 0) {
    throw new Error("User not found.");
  }

  revalidatePath("/admin/users");
}
