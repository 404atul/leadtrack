import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireAgencyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "agency_admin" || !session.user.agencyId) {
    redirect("/login");
  }

  return session;
}

export async function requireClientUser() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client_user" || !session.user.clientId) {
    redirect("/login");
  }

  return session;
}
