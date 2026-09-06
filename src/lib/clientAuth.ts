import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyActive } from "@/lib/billing";
import type { Client, Agency } from "@prisma/client";

export type ActiveClientSessionResult =
  | { status: "unauthenticated" }
  | { status: "inactive" }
  | { status: "ok"; clientId: string; client: Client & { agency: Agency } };

/**
 * Route-handler-safe equivalent of requireClientUser() — returns a result
 * instead of calling next/navigation's redirect(), which only works inside
 * Server Components / Server Actions, not app/api route handlers.
 */
export async function getActiveClientSession(): Promise<ActiveClientSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client_user" || !session.user.clientId) {
    return { status: "unauthenticated" };
  }

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId },
    include: { agency: true },
  });

  if (!client || !isAgencyActive(client.agency)) {
    return { status: "inactive" };
  }

  return { status: "ok", clientId: client.id, client };
}
