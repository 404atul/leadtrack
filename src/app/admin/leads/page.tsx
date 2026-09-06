import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { SELECTED_CLIENT_COOKIE } from "@/lib/constants";
import LeadsTable from "./LeadsTable";

export default async function AdminLeadsPage() {
  const session = await requireAgencyAdmin();
  const agencyId = session.user.agencyId!;

  const selectedClientIdRaw = cookies().get(SELECTED_CLIENT_COOKIE)?.value ?? null;
  const selectedClient = selectedClientIdRaw
    ? await prisma.client.findFirst({
        where: { id: selectedClientIdRaw, agencyId },
        select: { id: true, name: true },
      })
    : null;
  const selectedClientId = selectedClient?.id ?? null;

  const [leads, assignableUsers] = await Promise.all([
    prisma.lead.findMany({
      where: selectedClientId ? { clientId: selectedClientId } : { client: { agencyId } },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "agency_admin", isActive: true, agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500">
          {selectedClient ? `Showing leads for ${selectedClient.name}.` : "Showing leads across all clients."}
        </p>
      </div>
      <LeadsTable leads={leads} assignableUsers={assignableUsers} showClientColumn={!selectedClientId} />
    </div>
  );
}
