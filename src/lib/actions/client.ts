"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";

export async function createClient(formData: FormData) {
  const session = await requireAgencyAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();

  if (!name) {
    throw new Error("Client name is required.");
  }

  await prisma.client.create({
    data: {
      name,
      industry: industry || null,
      createdBy: session.user.id,
      agencyId: session.user.agencyId!,
    },
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin/dashboard");
}

async function requireOwnedClient(clientId: string, agencyId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, agencyId } });
  if (!client) {
    throw new Error("Client not found.");
  }
  return client;
}

export async function createClientUser(clientId: string, formData: FormData) {
  const session = await requireAgencyAdmin();
  const client = await requireOwnedClient(clientId, session.user.agencyId!);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are all required.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "client_user",
      clientId: client.id,
      agencyId: client.agencyId,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/users");
}

export async function updateClientMetaPageId(clientId: string, formData: FormData) {
  const session = await requireAgencyAdmin();
  await requireOwnedClient(clientId, session.user.agencyId!);

  const metaPageId = String(formData.get("metaPageId") ?? "").trim();

  await prisma.client.update({
    where: { id: clientId },
    data: { metaPageId: metaPageId || null },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}
