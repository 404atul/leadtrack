"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/session";
import { decrypt } from "@/lib/encryption";
import { saveMetaConnectionForClient, type MetaPage, type MetaAdAccount } from "@/lib/meta";

const ATTEMPT_TTL_MS = 30 * 60 * 1000;

export async function saveMetaSelection(attemptId: string, formData: FormData) {
  const session = await requireClientUser();
  const clientId = session.user.clientId!;

  const pageId = String(formData.get("pageId") ?? "");
  const adAccountId = String(formData.get("adAccountId") ?? "");

  if (!pageId || !adAccountId) {
    throw new Error("Please select a Page and an ad account.");
  }

  const attempt = await prisma.metaConnectionAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.clientId !== clientId) {
    throw new Error("Connection attempt not found.");
  }

  if (Date.now() - attempt.createdAt.getTime() > ATTEMPT_TTL_MS) {
    await prisma.metaConnectionAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    throw new Error("This connection attempt has expired. Please reconnect with Meta.");
  }

  const pages = attempt.pagesJson as unknown as MetaPage[];
  const adAccounts = attempt.adAccountsJson as unknown as MetaAdAccount[];

  const page = pages.find((p) => p.id === pageId);
  const adAccount = adAccounts.find((a) => a.id === adAccountId);
  if (!page || !adAccount) {
    throw new Error("Invalid selection.");
  }

  const longLivedUserToken = decrypt(attempt.encryptedLongLivedToken);

  await saveMetaConnectionForClient(clientId, {
    longLivedUserToken,
    tokenExpiresAt: attempt.tokenExpiresAt,
    page,
    adAccount,
  });

  await prisma.metaConnectionAttempt.delete({ where: { id: attempt.id } });

  redirect("/client/dashboard?meta_connected=1");
}
