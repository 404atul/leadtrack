import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Client } from "@prisma/client";

export type ActiveClientSessionResult =
  | { status: "unauthenticated" }
  | { status: "ok"; clientId: string; client: Client };

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
  });

  if (!client) {
    return { status: "unauthenticated" };
  }

  return { status: "ok", clientId: client.id, client };
}
