import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyActive } from "@/lib/billing";

export async function requireAgencyAdmin(opts?: { allowInactiveBilling?: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "agency_admin" || !session.user.agencyId) {
    redirect("/login");
  }

  if (!opts?.allowInactiveBilling) {
    const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
    if (!agency || !isAgencyActive(agency)) {
      redirect("/admin/billing");
    }
  }

  return session;
}

export async function requireClientUser() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client_user" || !session.user.clientId) {
    redirect("/login");
  }

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId },
    include: { agency: true },
  });

  if (!client || !isAgencyActive(client.agency)) {
    redirect("/account-paused");
  }

  return session;
}
