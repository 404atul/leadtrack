import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { SELECTED_CLIENT_COOKIE } from "@/lib/constants";
import { StatusBadge } from "@/components/Badges";
import { formatDate } from "@/lib/utils";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAgencyAdmin();
  const agencyId = session.user.agencyId!;

  const selectedClientId = cookies().get(SELECTED_CLIENT_COOKIE)?.value ?? null;
  const client = selectedClientId
    ? await prisma.client.findFirst({ where: { id: selectedClientId, agencyId } })
    : null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const leadScopeWhere = client ? { clientId: client.id } : { client: { agencyId } };

  const [totalClients, leadsToday, totalLeads, recentLeads] = await Promise.all([
    prisma.client.count({ where: { agencyId } }),
    prisma.lead.count({ where: { ...leadScopeWhere, createdAt: { gte: startOfToday } } }),
    prisma.lead.count({ where: leadScopeWhere }),
    prisma.lead.findMany({
      where: leadScopeWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {client ? `${client.name} Overview` : "Agency Overview"}
        </h1>
        <p className="text-sm text-gray-500">
          {client ? "Scoped to this client. Switch back to “View All Clients” for the agency-wide view." : "Across all your clients."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {client ? (
          <StatCard label="Client" value={client.name} hint={client.industry ?? "No industry set"} />
        ) : (
          <StatCard label="Total Clients" value={totalClients} />
        )}
        <StatCard label="Leads Today" value={leadsToday} hint={client ? undefined : "Across all clients"} />
        <StatCard label="Total Leads" value={totalLeads} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
          <Link href="/admin/leads" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              {!client && <th className="px-5 py-3">Client</th>}
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Platform</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">
                  No leads yet.
                </td>
              </tr>
            )}
            {recentLeads.map((lead) => (
              <tr key={lead.id} className="text-sm text-gray-700">
                {!client && <td className="px-5 py-3">{lead.client.name}</td>}
                <td className="px-5 py-3 font-medium text-gray-900">{lead.name}</td>
                <td className="px-5 py-3 capitalize">{lead.platform}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3 text-gray-500">{formatDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
