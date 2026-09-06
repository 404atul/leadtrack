"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/session";
import { decrypt } from "@/lib/encryption";
import { saveGoogleConnectionForClient, type GoogleCustomer } from "@/lib/google";

const ATTEMPT_TTL_MS = 30 * 60 * 1000;

export async function saveGoogleSelection(attemptId: string, formData: FormData) {
  const session = await requireClientUser();
  const clientId = session.user.clientId!;

  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) {
    throw new Error("Please select a Google Ads account.");
  }

  const attempt = await prisma.googleConnectionAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.clientId !== clientId) {
    throw new Error("Connection attempt not found.");
  }

  if (Date.now() - attempt.createdAt.getTime() > ATTEMPT_TTL_MS) {
    await prisma.googleConnectionAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    throw new Error("This connection attempt has expired. Please reconnect with Google Ads.");
  }

  const customers = attempt.customersJson as unknown as GoogleCustomer[];
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    throw new Error("Invalid selection.");
  }

  const refreshToken = decrypt(attempt.encryptedRefreshToken);

  await saveGoogleConnectionForClient(clientId, { refreshToken, customer });

  await prisma.googleConnectionAttempt.delete({ where: { id: attempt.id } });

  redirect("/client/dashboard?google_connected=1");
}
