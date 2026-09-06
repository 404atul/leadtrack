import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { StatusBadge, QualityBadge } from "@/components/Badges";
import CreateLoginButton from "./CreateLoginButton";
import MetaPageIdField from "./MetaPageIdField";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAgencyAdmin();

  const client = await prisma.client.findFirst({
    where: { id: params.id, agencyId: session.user.agencyId! },
    include: {
      users: { where: { role: "client_user" } },
      leads: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
        <p className="text-sm text-gray-500">{client.industry ?? "No industry set"} · Added {formatDate(client.createdAt)}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Meta Lead Ads Integration</h2>

        <div className="mb-4 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Self-service connection</p>
            {client.metaUserAccessToken ? (
              <p className="mt-0.5 text-sm text-gray-800">
                Connected: {client.metaPageName ?? "Unknown Page"}, {client.metaAdAccountName ?? "Unknown account"}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-gray-500">Not connected</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              client.metaUserAccessToken
                ? "bg-green-50 text-green-700 ring-green-600/20"
                : "bg-gray-100 text-gray-500 ring-gray-500/20"
            }`}
          >
            {client.metaUserAccessToken ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          This is set by the client from their own dashboard — admins can&apos;t connect Meta on a client&apos;s
          behalf.
        </p>

        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Manual Page ID override</p>
        <MetaPageIdField clientId={client.id} initialValue={client.metaPageId} />
        <p className="mt-2 text-xs text-gray-400">
          Leads from this Facebook Page will be automatically captured once linked.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Google Ads Integration</h2>

        <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Self-service connection</p>
            {client.googleRefreshToken ? (
              <p className="mt-0.5 text-sm text-gray-800">
                Connected: {client.googleCustomerName ?? "Unknown account"}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-gray-500">Not connected</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              client.googleRefreshToken
                ? "bg-green-50 text-green-700 ring-green-600/20"
                : "bg-gray-100 text-gray-500 ring-gray-500/20"
            }`}
          >
            {client.googleRefreshToken ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          This is set by the client from their own dashboard — admins can&apos;t connect Google Ads on a
          client&apos;s behalf.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Client Login</h2>
          {client.users.length === 0 && <CreateLoginButton clientId={client.id} />}
        </div>
        {client.users.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No login has been created for this client yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {client.users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-gray-500">{u.email}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    u.isActive ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-gray-100 text-gray-500 ring-gray-500/20"
                  }`}
                >
                  {u.isActive ? "Active" : "Deactivated"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Leads ({client.leads.length})</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Platform</th>
              <th className="px-5 py-3">Campaign</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Quality</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {client.leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                  No leads for this client yet.
                </td>
              </tr>
            )}
            {client.leads.map((lead) => (
              <tr key={lead.id} className="text-sm text-gray-700">
                <td className="px-5 py-3 capitalize">{lead.platform}</td>
                <td className="px-5 py-3">{lead.campaignName}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{lead.name}</td>
                <td className="px-5 py-3">{lead.phone}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3">
                  <QualityBadge quality={lead.quality} />
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
